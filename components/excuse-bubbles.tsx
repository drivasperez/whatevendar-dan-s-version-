"use client"

import { useState, useEffect, useRef } from "react"
import { animated, useSpring } from "@react-spring/web"
import { cn } from "@/lib/utils"

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

// Define bubble placement zones to ensure bubbles are fully visible
// These zones are positioned around the card, not on it
const bubblePlacementZones = [
  // Left column (far left)
  { x: [-280, -180], y: [0, 500] },
  // Right column (far right)
  { x: [500, 600], y: [0, 500] },
  // Top row (far top)
  { x: [-50, 370], y: [-200, -100] },
  // Bottom row (far bottom)
  { x: [-50, 370], y: [600, 700] },
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
      className="absolute px-3 py-2 bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-purple-100 text-sm font-medium text-gray-700 whitespace-nowrap bubble-shadow"
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
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Reduced maximum number of concurrent bubbles
  const MAX_CONCURRENT_BUBBLES = 4

  // Function to get a position from a safe zone
  const getPositionFromSafeZone = () => {
    // Select a random zone
    const zone = bubblePlacementZones[Math.floor(Math.random() * bubblePlacementZones.length)]

    // Get random position within the zone
    const x = zone.x[0] + Math.random() * (zone.x[1] - zone.x[0])
    const y = zone.y[0] + Math.random() * (zone.y[1] - zone.y[0])

    return { x, y }
  }

  // Function to add a new bubble
  const addBubble = () => {
    if (!active || !containerRef.current) return

    // Don't add more bubbles if we've reached the maximum
    if (bubbles.length >= MAX_CONCURRENT_BUBBLES) {
      // Schedule next attempt
      timeoutRef.current = setTimeout(addBubble, 1000)
      return
    }

    // Get position from a safe zone
    const position = getPositionFromSafeZone()

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
    const nextBubbleDelay = Math.random() * 2000 + 1000 // Random interval between 1-3 seconds
    timeoutRef.current = setTimeout(addBubble, nextBubbleDelay)
  }

  // Start generating bubbles when component mounts and is active
  useEffect(() => {
    if (active) {
      // Add first bubble after a delay
      timeoutRef.current = setTimeout(addBubble, 1000)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [active])

  // Remove bubble after animation completes
  const removeBubble = (id: number) => {
    setBubbles((prev) => prev.filter((bubble) => bubble.id !== id))
  }

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 overflow-visible pointer-events-none", !active && "hidden")}
      style={{ zIndex: 0 }} // Ensure bubbles are behind the card content
    >
      {bubbles.map((bubble) => (
        <AnimatedBubble
          key={bubble.id}
          id={bubble.id}
          text={bubble.text}
          position={bubble.position}
          onComplete={removeBubble}
        />
      ))}
    </div>
  )
}
