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

// Enhanced pearlescent color gradients with better contrast
const pearlColors = [
  "gradient-purple-pink",
  "gradient-blue-teal",
  "gradient-pink-purple",
  "gradient-indigo-blue",
  "gradient-rose-pink",
]

// Individual Bubble component with its own spring animation
function AnimatedBubble({
  id,
  text,
  position,
  colorClass,
  onComplete,
}: {
  id: number
  text: string
  position: { x: number; y: number }
  colorClass: string
  onComplete: (id: number) => void
}) {
  // Animation for the bubble movement and opacity
  const [props, api] = useSpring(() => ({
    from: { opacity: 0, scale: 0.8, y: position.y, rotate: -2 },
    to: async (next) => {
      // Simultaneously fade in and start rising in a single animation step
      await next({
        opacity: 1,
        scale: 1,
        y: position.y - 80, // Move upward more significantly during fade-in
        rotate: 2, // Subtle rotation for dreamy effect
        config: {
          tension: 120,
          friction: 14,
          duration: 1200, // Controlled duration for the initial rise
        },
      })

      // Calculate distance to top of screen (negative y value)
      const distanceToTop = -position.y - 100 // Extra 100px to ensure it's off-screen

      // Continue rising to the top of the screen while fading out near the end
      await next({
        y: distanceToTop,
        opacity: 0,
        scale: 0.9,
        rotate: -2, // Subtle rotation back
        config: {
          tension: 50,
          friction: 20,
          // Adjust duration based on distance for consistent speed
          duration: Math.abs(distanceToTop - (position.y - 80)) * 12,
        },
      })
    },
    onRest: () => onComplete(id),
  }))

  // Animation for the shimmer effect
  const [shimmerProps, shimmerApi] = useSpring(() => ({
    from: { backgroundPosition: "0% 50%" },
    to: { backgroundPosition: "100% 50%" },
    config: { duration: 3000 },
    loop: { reverse: true },
  }))

  return (
    <animated.div
      className={`fixed px-4 py-2.5 rounded-2xl text-sm font-medium text-gray-800 whitespace-nowrap pearlescent-bubble ${colorClass}`}
      style={{
        userSelect: 'none',
        opacity: props.opacity,
        transform: props.scale.to((s) => `scale(${s}) rotate(${props.rotate.get()}deg)`),
        left: position.x,
        top: props.y,
        backgroundSize: "200% 200%",
        backgroundPosition: shimmerProps.backgroundPosition,
        willChange: "opacity, transform, top, background-position", // Optimize for animation performance
        boxShadow:
          "0 4px 15px rgba(150, 150, 255, 0.3), 0 2px 5px rgba(150, 150, 255, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(8px)",
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
      colorClass: string
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
    const bottomZone = { min: centerY + cardHeight / 2 + safeMargin, max: height - 20 } // Start bubbles from bottom

    // Randomly select a zone, but favor bottom zone for upward movement
    // 0: left, 1: right, 2: bottom (with higher probability)
    const zoneWeights = [1, 1, 8] // Higher weight for bottom zone
    const totalWeight = zoneWeights.reduce((a, b) => a + b, 0)
    let random = Math.random() * totalWeight

    let zone
    for (zone = 0; zone < zoneWeights.length; zone++) {
      if (random < zoneWeights[zone]) break
      random -= zoneWeights[zone]
    }

    let x, y

    switch (zone) {
      case 0: // Left zone
        x = Math.random() * (leftZone.max - leftZone.min) + leftZone.min
        y = Math.random() * (height - 200) + 100 // Distribute vertically
        break
      case 1: // Right zone
        x = Math.random() * (rightZone.max - rightZone.min) + rightZone.min
        y = Math.random() * (height - 200) + 100 // Distribute vertically
        break
      case 2: // Bottom zone (most common for upward movement)
      default:
        x = Math.random() * (width - 40) + 20
        y = Math.random() * (bottomZone.max - bottomZone.min) + bottomZone.min
        break
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

    // Get random pearlescent color class
    const colorClass = pearlColors[Math.floor(Math.random() * pearlColors.length)]

    // Add new bubble
    const newBubble = {
      id: nextIdRef.current++,
      text,
      position,
      colorClass,
    }

    setBubbles((prev) => [...prev, newBubble])

    // Schedule next bubble with variable delay
    const nextBubbleDelay = Math.random() * 1200 + 600 // Random interval between 0.6-1.8 seconds
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
      <style jsx global>{`
        .pearlescent-bubble {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.65));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          background-size: 200% 200%;
          border: none; /* Remove the white border */
        }
        
        /* Enhanced gradient colors with better contrast */
        .gradient-purple-pink {
          background: linear-gradient(135deg, 
            rgba(233, 213, 255, 0.9), 
            rgba(251, 207, 232, 0.85), 
            rgba(224, 231, 255, 0.9));
          color: #5b21b6;
        }
        
        .gradient-blue-teal {
          background: linear-gradient(135deg, 
            rgba(191, 219, 254, 0.9), 
            rgba(204, 251, 241, 0.85), 
            rgba(199, 210, 254, 0.9));
          color: #1e40af;
        }
        
        .gradient-pink-purple {
          background: linear-gradient(135deg, 
            rgba(252, 231, 243, 0.9), 
            rgba(233, 213, 255, 0.85), 
            rgba(224, 231, 255, 0.9));
          color: #9d174d;
        }
        
        .gradient-indigo-blue {
          background: linear-gradient(135deg, 
            rgba(199, 210, 254, 0.9), 
            rgba(191, 219, 254, 0.85), 
            rgba(204, 251, 241, 0.9));
          color: #3730a3;
        }
        
        .gradient-rose-pink {
          background: linear-gradient(135deg, 
            rgba(254, 205, 211, 0.9), 
            rgba(251, 207, 232, 0.85), 
            rgba(233, 213, 255, 0.9));
          color: #be123c;
        }
      `}</style>
      {bubbles.map((bubble) => (
        <AnimatedBubble
          key={bubble.id}
          id={bubble.id}
          text={bubble.text}
          position={bubble.position}
          colorClass={bubble.colorClass}
          onComplete={removeBubble}
        />
      ))}
    </>
  )
}
