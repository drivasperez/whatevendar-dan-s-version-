"use client"

import { useState, useRef, useEffect } from "react"
import { animated, useSpring } from "@react-spring/web"
import { useDrag } from "@use-gesture/react"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"

interface LoadingResultCardProps {
  decision: "declined" | "maybe" | "maybe-declined"
  onDismiss: () => void
  active: boolean
  index: number
  xThreshold?: number // Configurable threshold
}

export function LoadingResultCard({
  decision,
  onDismiss,
  active,
  index,
  xThreshold = 50, // Lower default threshold for loading cards
}: LoadingResultCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const [swiped, setSwiped] = useState(false)
  const [swipeCommitted, setSwipeCommitted] = useState(false) // Track if swipe is committed
  const [swipeProgress, setSwipeProgress] = useState(0) // Track swipe progress (0-1)

  // Use refs to track the current position and velocity
  const positionRef = useRef({ x: 0, y: 0, rotation: 0 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const lastMoveTimeRef = useRef(0)
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Commit threshold - percentage of xThreshold where swipe becomes committed
  const commitThresholdPercent = 0.7 // 70% of xThreshold

  // Velocity threshold - minimum velocity to commit a swipe even if distance is below threshold
  const velocityCommitThreshold = 0.5 // px/ms

  const getIndicatorScale = (direction: "left" | "right" | null, x: number) => {
    if (!direction) return 1

    // Base scale when not moving
    const baseScale = 1

    // Calculate progress based on direction
    const progress = Math.min(Math.abs(x) / xThreshold, 1)

    // Scale based on progress with easing
    return baseScale + progress * 0.8
  }

  // Calculate visual feedback based on swipe progress
  const getSwipeFeedback = (progress: number) => {
    // Scale slightly down as card is swiped
    const scale = 1 - progress * 0.05

    // Slightly reduce opacity as card is swiped
    const opacity = 1 - progress * 0.2

    return { scale, opacity }
  }

  // Get appropriate styling based on decision
  const getDecisionStyles = () => {
    switch (decision) {
      case "declined":
        return {
          bgColor: "bg-red-100",
          textColor: "text-red-800",
        }
      case "maybe":
        return {
          bgColor: "bg-blue-100",
          textColor: "text-blue-800",
        }
      case "maybe-declined":
        return {
          bgColor: "bg-purple-100",
          textColor: "text-purple-800",
        }
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
        }
    }
  }

  const styles = getDecisionStyles()

  // Set up spring for the card with more responsive settings
  const [{ x, y, rotate, scale, opacity }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    opacity: 1,
    config: { tension: 800, friction: 15, mass: 0.1 },
  }))

  // Set up spring for the emoji
  const [{ rotate: emojiRotate }, emojiApi] = useSpring(() => ({
    rotate: 0,
    config: { tension: 200, friction: 10 },
  }))

  // Start the thinking animation
  useEffect(() => {
    emojiApi.start({
      from: { rotate: -10 },
      to: { rotate: 10 },
      loop: { reverse: true },
      config: { duration: 1000 },
    })
  }, [emojiApi])

  // Function to complete swipe animation
  const completeSwipe = (direction: "left" | "right", velocity: { x: number; y: number }) => {
    if (swiped) return // Prevent duplicate swipes

    setSwiped(true)
    setSwipeCommitted(false)

    // Clear any safety timers
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current)
      safetyTimerRef.current = null
    }

    // Calculate destination based on screen dimensions and velocity
    const screenWidth = window.innerWidth

    // Use velocity to determine how far off-screen to animate
    // Higher velocity = further off-screen for more natural feel
    const velocityMultiplier = 0.8 // Increased for more responsive feel
    const xVelocityOffset = Math.abs(velocity.x) * velocityMultiplier * screenWidth

    // Ensure minimum distance off-screen (2x screen width)
    const minOffscreenX = screenWidth * 2

    // Calculate final destination
    const xDest =
      direction === "left" ? -Math.max(minOffscreenX, xVelocityOffset) : Math.max(minOffscreenX, xVelocityOffset)

    // Calculate rotation based on direction and velocity
    const rotationFactor = 45 // Maximum rotation in degrees (increased for more visual feedback)
    const rotation = direction === "left" ? -rotationFactor : rotationFactor

    // Animate the card off screen with enhanced configuration
    api.start({
      x: xDest,
      y: 0,
      rotate: rotation,
      scale: 0.8, // Scale down as it leaves
      opacity: 0.5, // Fade out as it leaves
      config: {
        duration: 500, // Ensure minimum animation duration
        easing: (t) => 1 - Math.pow(1 - t, 3), // Cubic ease-out for natural movement
      },
      onRest: () => {
        // Call onDismiss after the animation completes
        onDismiss()
      },
    })
  }

  // Set up drag gesture with improved handling
  const bind = useDrag(
    ({ down, movement: [mx, my], velocity: [vx, vy], first, last }) => {
      // Don't process if card has already been swiped
      if (swiped) return

      // On first touch, reset state
      if (first) {
        positionRef.current = { x: 0, y: 0, rotation: 0 }
        velocityRef.current = { x: 0, y: 0 }
        lastMoveTimeRef.current = Date.now()
        setSwipeCommitted(false)
        setSwipeProgress(0)

        // Clear any existing safety timers
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current)
          safetyTimerRef.current = null
        }
      }

      // Update velocity tracking
      const now = Date.now()
      const dt = now - lastMoveTimeRef.current
      if (dt > 0) {
        velocityRef.current = {
          x: Math.abs(vx),
          y: Math.abs(vy),
        }
        lastMoveTimeRef.current = now
      }

      // Determine swipe direction for visual indicator
      const dir = mx < 0 ? "left" : "right"
      setSwipeDirection(dir)

      // Calculate swipe progress
      const progress = Math.min(Math.abs(mx) / xThreshold, 1)
      setSwipeProgress(progress)

      // Check if swipe should be committed based on distance or velocity
      const isCommitDistance = progress >= commitThresholdPercent
      const isCommitVelocity = velocityRef.current.x > velocityCommitThreshold

      const shouldCommit = isCommitDistance || isCommitVelocity

      // Once committed, stay committed
      if (shouldCommit && !swipeCommitted) {
        setSwipeCommitted(true)
      }

      // If we're not holding down anymore
      if (!down) {
        // If swipe is committed or exceeds threshold, complete the swipe
        if (swipeCommitted || Math.abs(mx) > xThreshold) {
          completeSwipe(dir, velocityRef.current)
        } else {
          // Reset position with a spring effect
          api.start({
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            opacity: 1,
            config: { tension: 500, friction: 30 },
          })
          setSwipeDirection(null)
          setSwipeProgress(0)
        }
        return
      }

      // Update card position and rotation during drag
      if (down) {
        // Apply a multiplier to make the card move faster than the mouse
        const movementMultiplier = 1.2

        // Update position directly without any smoothing or delay
        positionRef.current = {
          x: mx * movementMultiplier,
          y: my * movementMultiplier,
          rotation: mx / 15,
        }

        // Get visual feedback based on swipe progress
        const feedback = getSwipeFeedback(progress)

        // Apply the position directly to the spring
        api.start({
          x: positionRef.current.x,
          y: positionRef.current.y,
          rotate: positionRef.current.rotation,
          scale: feedback.scale,
          opacity: feedback.opacity,
          immediate: true, // This is critical for direct movement
        })
      }
    },
    {
      enabled: active && !swiped,
      filterTaps: false, // Disable tap filtering for more immediate response
      rubberband: true, // Enable rubberband effect for better feel
      from: [0, 0],
      bounds: { left: -1000, right: 1000, top: -1000, bottom: 1000 }, // Set large bounds
    },
  )

  // Safety mechanism: detect and fix stuck cards
  useEffect(() => {
    if (swipeCommitted && !swiped && active) {
      // If a card is committed but not yet swiped, ensure it completes
      safetyTimerRef.current = setTimeout(() => {
        if (swipeCommitted && !swiped && swipeDirection) {
          completeSwipe(swipeDirection, velocityRef.current)
        }
      }, 300) // Short delay to allow natural completion first

      return () => {
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current)
        }
      }
    }
  }, [swipeCommitted, swiped, active, swipeDirection])

  return (
    <animated.div
      className={cn(
        "swipe-card",
        swipeDirection === "left" && "swipe-left",
        swipeDirection === "right" && "swipe-right",
        swipeCommitted && "swipe-committed",
        swiped && "pointer-events-none",
      )}
      style={{
        x,
        y,
        rotate,
        scale,
        opacity,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        touchAction: "none", // Prevent browser handling of touch gestures
        willChange: "transform, opacity", // Hint to browser to optimize transforms
      }}
      {...(active && !swiped ? bind() : {})}
    >
      <div className={cn("swipe-card-content", "glass-card", "flex flex-col justify-between shadow-lg")}>
        {/* Enhanced indicator design with progress feedback */}
        <div className="swipe-indicator">
          <div
            className="swipe-indicator-item swipe-indicator-left"
            style={{
              opacity: swipeDirection === "left" ? Math.min(swipeProgress * 1.5, 1) : 0,
              transform: `scale(${getIndicatorScale("left", positionRef.current.x)})`,
            }}
          >
            <div className="indicator-icon continue-icon">
              <ArrowRight className="h-5 w-5 text-white" />
            </div>
          </div>

          <div
            className="swipe-indicator-item swipe-indicator-right"
            style={{
              opacity: swipeDirection === "right" ? Math.min(swipeProgress * 1.5, 1) : 0,
              transform: `scale(${getIndicatorScale("right", positionRef.current.x)})`,
            }}
          >
            <div className="indicator-icon continue-icon">
              <ArrowRight className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <span className="event-type-badge">Processing</span>
        </div>

        <div className="flex flex-col items-center justify-center flex-grow">
          <animated.div
            style={{
              rotate: emojiRotate,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <span className="text-7xl mb-4" role="img" aria-label="thinking">
              🏃‍♂️💨
            </span>
          </animated.div>

          <div className="card-divider"></div>

          <p className={cn("text-lg font-medium mb-2", styles.textColor)}>
            Generating an excuse...
          </p>
        </div>

        <div className="swipe-instructions">
          Using Claude to create a custom excuse
        </div>
      </div>
    </animated.div>
  )
}
