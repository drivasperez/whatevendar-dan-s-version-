"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

interface BlobPoint {
  angle: number
  radius: number
  originalRadius: number
  radiusOffset: number
  radiusPhase: number
  speedMultiplier: number
}

interface Blob {
  x: number
  y: number
  baseRadius: number
  points: BlobPoint[]
  xSpeed: number
  ySpeed: number
  color: string
  opacity: number
  morphSpeed: number
  zIndex: number
  rotationSpeed: number
  currentRotation: number
  acceleration: { x: number; y: number }
  maxSpeed: number
}

export function LavaLampBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blurCanvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const animationRef = useRef<number>(0)
  const blobsRef = useRef<Blob[]>([])
  const { theme } = useTheme()
  const timeRef = useRef<number>(0)
  const [isLowPowerDevice, setIsLowPowerDevice] = useState(false)

  // Enhanced colors with more variety
  const lightModeColors = [
    "rgba(233, 213, 255, 0.5)", // Soft purple
    "rgba(224, 231, 255, 0.5)", // Soft blue
    "rgba(254, 215, 226, 0.5)", // Soft pink
    "rgba(209, 250, 229, 0.5)", // Soft teal
    "rgba(254, 240, 138, 0.5)", // Soft yellow
    "rgba(220, 252, 231, 0.5)", // Soft green
    "rgba(254, 202, 202, 0.5)", // Soft red
  ]

  const darkModeColors = [
    "rgba(192, 132, 252, 0.25)", // Purple
    "rgba(129, 140, 248, 0.25)", // Indigo
    "rgba(244, 114, 182, 0.25)", // Pink
    "rgba(45, 212, 191, 0.25)", // Teal
    "rgba(250, 204, 21, 0.25)", // Yellow
    "rgba(74, 222, 128, 0.25)", // Green
    "rgba(248, 113, 113, 0.25)", // Red
  ]

  // Detect low power devices
  useEffect(() => {
    // Simple heuristic: check if it's a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    // Or if the device has a low number of logical processors
    const hasLowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4

    setIsLowPowerDevice(isMobile || hasLowCPU)
  }, [])

  // Initialize the canvas and blobs
  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window !== "undefined") {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }
    }

    // Set initial dimensions
    updateDimensions()

    // Update dimensions on resize
    window.addEventListener("resize", updateDimensions)

    return () => {
      window.removeEventListener("resize", updateDimensions)
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  // Create blobs when dimensions change
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return

    const colors = theme === "dark" ? darkModeColors : lightModeColors

    // Adjust number of blobs based on screen size and device capability
    const baseBlobCount = Math.min(Math.max(Math.floor(dimensions.width / 350), 3), 6)
    const numBlobs = isLowPowerDevice ? Math.max(baseBlobCount - 2, 2) : baseBlobCount

    // Create new blobs with more diverse properties
    blobsRef.current = Array.from({ length: numBlobs }, (_, index) => {
      // More varied base radius
      const baseRadius = Math.random() * (dimensions.width / 6) + dimensions.width / 16

      // Vary the number of points more significantly (6-18 points)
      const numPoints = Math.floor(Math.random() * 12) + 6

      // Create points around the blob with varying radiuses
      const points: BlobPoint[] = []
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2

        // More variation in radius (0.5-1.5 times the base radius)
        const radiusVariation = Math.random() * 1.0 + 0.5
        const originalRadius = baseRadius * radiusVariation

        points.push({
          angle,
          radius: originalRadius,
          originalRadius,
          // More variation in morphing amplitude (10-70% of base radius)
          radiusOffset: Math.random() * 0.6 + 0.1,
          // Random starting phase
          radiusPhase: Math.random() * Math.PI * 2,
          // Each point can morph at slightly different speeds
          speedMultiplier: Math.random() * 0.6 + 0.7,
        })
      }

      // Assign a z-index for layering (0-3 for more depth layers)
      const zIndex = Math.floor(Math.random() * 4)

      // Adjust opacity based on z-index for depth effect
      const baseOpacity = theme === "dark" ? 0.25 : 0.5
      const opacityByLayer = [
        baseOpacity * 0.6, // Furthest back
        baseOpacity * 0.75,
        baseOpacity * 0.9,
        baseOpacity * 1.1, // Closest to viewer
      ]

      // Slower initial speed
      const initialSpeed = (Math.random() - 0.5) * 0.15 // Reduced by 50%

      return {
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        baseRadius,
        points,
        xSpeed: initialSpeed,
        ySpeed: initialSpeed * (Math.random() > 0.5 ? 1 : -1), // Different direction
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: opacityByLayer[zIndex],
        // Slower morphing speeds (reduced by ~60%)
        morphSpeed: Math.random() * 0.00025 + 0.00005,
        zIndex,
        // Slower rotation (reduced by ~70%)
        rotationSpeed: (Math.random() - 0.5) * 0.00006,
        currentRotation: Math.random() * Math.PI * 2,
        // Add acceleration for more organic movement (reduced by ~70%)
        acceleration: { x: 0, y: 0 },
        // Lower maximum speed (reduced by ~60%)
        maxSpeed: Math.random() * 0.12 + 0.08,
      }
    })

    // Sort blobs by z-index for proper layering
    blobsRef.current.sort((a, b) => a.zIndex - b.zIndex)

    // Start animation if not already running
    if (!animationRef.current) {
      timeRef.current = Date.now()
      animateBlobs()
    }
  }, [dimensions, theme, isLowPowerDevice])

  // Update blob colors when theme changes
  useEffect(() => {
    if (blobsRef.current.length === 0) return

    const colors = theme === "dark" ? darkModeColors : lightModeColors
    const baseOpacity = theme === "dark" ? 0.25 : 0.5

    blobsRef.current = blobsRef.current.map((blob) => {
      // Calculate opacity based on z-index
      const opacityMultiplier = blob.zIndex === 3 ? 1.1 : blob.zIndex === 2 ? 0.9 : blob.zIndex === 1 ? 0.75 : 0.6

      return {
        ...blob,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: baseOpacity * opacityMultiplier,
      }
    })
  }, [theme])

  // Draw a single blob
  const drawBlob = (ctx: CanvasRenderingContext2D, blob: Blob, time: number) => {
    ctx.save()

    // Create enhanced gradient for more depth
    const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.baseRadius * 1.5)

    // Parse the rgba color to get the base color
    const baseColor = blob.color.substring(0, blob.color.lastIndexOf(","))

    // Enhanced gradient with more stops for better visual effect
    gradient.addColorStop(0, `${baseColor}, ${blob.opacity * 1.2})`)
    gradient.addColorStop(0.4, `${baseColor}, ${blob.opacity})`)
    gradient.addColorStop(0.8, `${baseColor}, ${blob.opacity * 0.8})`)
    gradient.addColorStop(1, `${baseColor}, 0)`)

    ctx.fillStyle = gradient

    // Begin drawing the blob shape
    ctx.beginPath()

    // Apply the current rotation to all points
    const rotatedPoints = blob.points.map((point) => {
      const rotatedAngle = point.angle + blob.currentRotation
      return {
        ...point,
        rotatedAngle,
      }
    })

    // Calculate the first point with morphing
    const firstPoint = rotatedPoints[0]
    const firstRadius =
      firstPoint.radius +
      Math.sin(time * blob.morphSpeed * firstPoint.speedMultiplier + firstPoint.radiusPhase) *
        firstPoint.radiusOffset *
        blob.baseRadius

    const startX = blob.x + Math.cos(firstPoint.rotatedAngle) * firstRadius
    const startY = blob.y + Math.sin(firstPoint.rotatedAngle) * firstRadius

    ctx.moveTo(startX, startY)

    // Draw curves between each point with enhanced morphing
    for (let i = 0; i < rotatedPoints.length; i++) {
      const currentPoint = rotatedPoints[i]
      const nextPoint = rotatedPoints[(i + 1) % rotatedPoints.length]

      // Calculate current and next point positions with morphing
      const currentRadius =
        currentPoint.radius +
        Math.sin(time * blob.morphSpeed * currentPoint.speedMultiplier + currentPoint.radiusPhase) *
          currentPoint.radiusOffset *
          blob.baseRadius

      const nextRadius =
        nextPoint.radius +
        Math.sin(time * blob.morphSpeed * nextPoint.speedMultiplier + nextPoint.radiusPhase) *
          nextPoint.radiusOffset *
          blob.baseRadius

      // Calculate control points for the curve with more natural curvature
      const cp1Angle = currentPoint.rotatedAngle + (nextPoint.rotatedAngle - currentPoint.rotatedAngle) / 3
      const cp2Angle = currentPoint.rotatedAngle + ((nextPoint.rotatedAngle - currentPoint.rotatedAngle) * 2) / 3

      // Add some variation to control point distances for more organic shapes
      const cp1RadiusMultiplier = 0.9 + Math.sin(time * 0.0005 + i) * 0.1
      const cp2RadiusMultiplier = 0.9 + Math.cos(time * 0.0005 + i) * 0.1

      const cp1Radius = (currentRadius + (nextRadius - currentRadius) / 3) * cp1RadiusMultiplier
      const cp2Radius = (currentRadius + ((nextRadius - currentRadius) * 2) / 3) * cp2RadiusMultiplier

      const cp1x = blob.x + Math.cos(cp1Angle) * cp1Radius
      const cp1y = blob.y + Math.sin(cp1Angle) * cp1Radius

      const cp2x = blob.x + Math.cos(cp2Angle) * cp2Radius
      const cp2y = blob.y + Math.sin(cp2Angle) * cp2Radius

      const endX = blob.x + Math.cos(nextPoint.rotatedAngle) * nextRadius
      const endY = blob.y + Math.sin(nextPoint.rotatedAngle) * nextRadius

      // Draw the curve
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY)
    }

    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // Animation function with enhanced movement
  const animateBlobs = () => {
    const canvas = canvasRef.current
    const blurCanvas = blurCanvasRef.current
    if (!canvas || !blurCanvas) return

    const ctx = canvas.getContext("2d")
    const blurCtx = blurCanvas.getContext("2d")
    if (!ctx || !blurCtx) return

    // Calculate elapsed time for smooth animation
    const now = Date.now()
    const elapsed = Math.min(now - timeRef.current, 50) // Cap at 50ms to prevent large jumps
    timeRef.current = now

    // Clear both canvases
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    blurCtx.clearRect(0, 0, blurCanvas.width, blurCanvas.height)

    // Update and draw each blob on the main canvas
    blobsRef.current.forEach((blob) => {
      // Update rotation (slower)
      blob.currentRotation += blob.rotationSpeed * elapsed

      // Occasionally update acceleration for more organic movement (less frequent)
      if (Math.random() < 0.005) {
        // Reduced from 0.01
        blob.acceleration = {
          x: (Math.random() - 0.5) * 0.00003, // Reduced by ~70%
          y: (Math.random() - 0.5) * 0.00003,
        }
      }

      // Apply acceleration to speed
      blob.xSpeed += blob.acceleration.x * elapsed
      blob.ySpeed += blob.acceleration.y * elapsed

      // Limit speed to max speed
      const currentSpeed = Math.sqrt(blob.xSpeed * blob.xSpeed + blob.ySpeed * blob.ySpeed)
      if (currentSpeed > blob.maxSpeed) {
        blob.xSpeed = (blob.xSpeed / currentSpeed) * blob.maxSpeed
        blob.ySpeed = (blob.ySpeed / currentSpeed) * blob.maxSpeed
      }

      // Update position with time-based movement
      blob.x += blob.xSpeed * elapsed
      blob.y += blob.ySpeed * elapsed

      // Calculate effective radius for collision detection (use the largest point radius)
      const effectiveRadius = blob.baseRadius * 1.5

      // Bounce off edges with a small buffer and more natural behavior
      if (blob.x - effectiveRadius < 0) {
        blob.x = effectiveRadius
        blob.xSpeed = Math.abs(blob.xSpeed) * (0.8 + Math.random() * 0.4)
      } else if (blob.x + effectiveRadius > canvas.width) {
        blob.x = canvas.width - effectiveRadius
        blob.xSpeed = -Math.abs(blob.xSpeed) * (0.8 + Math.random() * 0.4)
      }

      if (blob.y - effectiveRadius < 0) {
        blob.y = effectiveRadius
        blob.ySpeed = Math.abs(blob.ySpeed) * (0.8 + Math.random() * 0.4)
      } else if (blob.y + effectiveRadius > canvas.height) {
        blob.y = canvas.height - effectiveRadius
        blob.ySpeed = -Math.abs(blob.ySpeed) * (0.8 + Math.random() * 0.4)
      }

      // Ensure minimum speed for constant movement (reduced)
      const minSpeed = 0.015 // Reduced by 50%
      if (currentSpeed < minSpeed) {
        // Normalize and scale to minimum speed
        const angle = Math.atan2(blob.ySpeed, blob.xSpeed)
        blob.xSpeed = Math.cos(angle) * minSpeed
        blob.ySpeed = Math.sin(angle) * minSpeed
      }

      // Draw the blob on the main canvas
      drawBlob(ctx, blob, now)
    })

    // Copy the main canvas to the blur canvas
    blurCtx.drawImage(canvas, 0, 0)

    // Continue animation
    animationRef.current = requestAnimationFrame(animateBlobs)
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1]">
      {/* Hidden canvas for drawing the original shapes */}
      <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} style={{ display: "none" }} />

      {/* Visible canvas with blur effect applied */}
      <canvas
        ref={blurCanvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{
          filter: `blur(${isLowPowerDevice ? 10 : 30}px)`,
          opacity: 0.9,
        }}
      />
    </div>
  )
}
