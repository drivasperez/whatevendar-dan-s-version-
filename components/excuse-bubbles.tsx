"use client"

import { useState, useEffect, useRef } from "react"
import { animated, useSpring } from "@react-spring/web"

// List of humorous excuses
const humorousExcuses = [
  "The vibe is just off",
  "Too many Capricorns",
  "Mercury is in retrograde",
  "My cat needs emotional support",
  "I'm washing my hair... all day",
  "I'm allergic to social events",
  "My plants need watering",
  "I'm on a strict no-fun diet",
  "My horoscope said no",
  "I need to alphabetize my spice rack",
  "I'm practicing social distancing... from everyone",
  "I have a date with my Netflix queue",
  "My imaginary friend is visiting",
  "I'm conserving my social energy",
  "I suddenly developed plans",
  "I need to count my socks",
  "I'm busy doing nothing",
  "I'm having an existential crisis",
  "I need to stare at a wall",
  "My bed needs me more",
  "I'm on a journey of self-discovery",
  "I'm allergic to that day of the week",
  "I'm in a committed relationship with my couch",
  "I need to reorganize my emoji keyboard",
  "I'm training for a nap competition",
]

// Individual Bubble component with its own spring animation
function AnimatedBubble({
  id,
  text,
  position,
  onComplete,
}: {
  id: number
  text: string
  position: { x: number; y: number }
  onComplete: (id: number) => void
}) {
  // Simple animation that just fades in, stays, and fades out
  const [props, api] = useSpring(() => ({
    from: { opacity: 0, scale: 0.8, y: position.y },
    to: [
      { opacity: 1, scale: 1, y: position.y - 20 },
      { opacity: 1, scale: 1, y: position.y - 40 },
      { opacity: 0, scale: 0.9, y: position.y - 60 },
    ],
    config: { tension: 120, friction: 14 },
    onRest: () => onComplete(id),
  }))

  return (
    <animated.div
      className="fixed px-3 py-2 bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-purple-100 text-sm font-medium text-gray-700 whitespace-nowrap bubble-shadow"
      style={{
        opacity: props.opacity,
        transform: props.scale.to((s) => `scale(${s})`),
        left: position.x,
        top: props.y,
      }}
    >
      {text}
    </animated.div>
  )
}

interface ExcuseBubblesProps {
  active: boolean
}

export function ExcuseBubbles({ active }: ExcuseBubblesProps) {
  const [bubbles, setBubbles] = useState<
    {
      id: number
      text: string
      position: { x: number; y: number }
    }[]
  >([])
  const nextIdRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [viewportDimensions, setViewportDimensions] = useState({ width: 0, height: 0 })

  // Get viewport dimensions on mount and window resize
  useEffect(() => {
    const updateDimensions = () => {
      setViewportDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Initial dimensions
    updateDimensions()

    // Update on resize
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  // Reduced maximum number of concurrent bubbles
  const MAX_CONCURRENT_BUBBLES = 4

  // Function to get a safe position away from the center of the screen
  const getSafePosition = () => {
    const { width, height } = viewportDimensions
    if (width === 0 || height === 0) return { x: 0, y: 0 }

    // Define the center area to avoid (where cards are)
    const centerX = width / 2
    const centerY = height / 2
    const cardWidth = 320 // Approximate card width
    const cardHeight = 500 // Approximate card height

    // Safe margin around the card area
    const safeMargin = 100

    // Calculate safe zones (areas away from the center)
    const leftZone = { min: 20, max: centerX - cardWidth / 2 - safeMargin }
    const rightZone = { min: centerX + cardWidth / 2 + safeMargin, max: width - 20 }
    const topZone = { min: 80, max: centerY - cardHeight / 2 - safeMargin } // Account for navbar
    const bottomZone = { min: centerY + cardHeight / 2 + safeMargin, max: height - 20 }

    // Randomly select a zone
    const zone = Math.floor(Math.random() * 4) // 0: left, 1: right, 2: top, 3: bottom

    let x, y

    switch (zone) {
      case 0: // Left zone
        x = Math.random() * (leftZone.max - leftZone.min) + leftZone.min
        y = Math.random() * (height - 100) + 50
        break
      case 1: // Right zone
        x = Math.random() * (rightZone.max - rightZone.min) + rightZone.min
        y = Math.random() * (height - 100) + 50
        break
      case 2: // Top zone
        x = Math.random() * (width - 40) + 20
        y = Math.random() * (topZone.max - topZone.min) + topZone.min
        break
      case 3: // Bottom zone
        x = Math.random() * (width - 40) + 20
        y = Math.random() * (bottomZone.max - bottomZone.min) + bottomZone.min
        break
      default:
        x = 0
        y = 0
    }

    return { x, y }
  }

  // Function to add a new bubble
  const addBubble = () => {
    if (!active) return

    // Don't add more bubbles if we've reached the maximum
    if (bubbles.length >= MAX_CONCURRENT_BUBBLES) {
      // Schedule next attempt
      timeoutRef.current = setTimeout(addBubble, 1000)
      return
    }

    // Get position from a safe zone
    const position = getSafePosition()

    // Skip if we got an invalid position (might happen before viewport is measured)
    if (position.x === 0 && position.y === 0) {
      timeoutRef.current = setTimeout(addBubble, 500)
      return
    }

    // Get random excuse
    const text = humorousExcuses[Math.floor(Math.random() * humorousExcuses.length)]

    // Add new bubble
    const newBubble = {
      id: nextIdRef.current++,
      text,
      position,
    }

    setBubbles((prev) => [...prev, newBubble])

    // Schedule next bubble with longer delay
    const nextBubbleDelay = Math.random() * 1000 + 500 // Random interval between 1-3 seconds
    timeoutRef.current = setTimeout(addBubble, nextBubbleDelay)
  }

  // Start generating bubbles when component mounts and is active
  useEffect(() => {
    if (active && viewportDimensions.width > 0) {
      // Add first bubble after a delay
      timeoutRef.current = setTimeout(addBubble, 1000)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [active, viewportDimensions])

  // Remove bubble after animation completes
  const removeBubble = (id: number) => {
    setBubbles((prev) => prev.filter((bubble) => bubble.id !== id))
  }

  // If not active, don't render anything
  if (!active) return null

  return (
    <>
      {bubbles.map((bubble) => (
        <AnimatedBubble
          key={bubble.id}
          id={bubble.id}
          text={bubble.text}
          position={bubble.position}
          onComplete={removeBubble}
        />
      ))}
    </>
  )
}
