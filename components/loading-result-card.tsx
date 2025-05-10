"use client"

import { useState, useRef } from "react"
import { animated, useSpring } from "@react-spring/web"
import { useDrag } from "@use-gesture/react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface LoadingResultCardProps {
  decision: "declined" | "maybe" | "maybe-declined"
  onDismiss: () => void
  active: boolean
  index: number
}

export function LoadingResultCard({ decision, onDismiss, active, index }: LoadingResultCardProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const [swiped, setSwiped] = useState(false)

  // Use a ref to track the current position directly
  const positionRef = useRef({ x: 0, y: 0, rotation: 0 })

  // Get appropriate styling based on decision
  const getDecisionStyles = () => {
    switch (decision) {
      case "declined":
        return {
          bgColor: "bg-red-100 dark:bg-red-900/30",
          textColor: "text-red-800 dark:text-red-200",
        }
      case "maybe":
        return {
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          textColor: "text-blue-800 dark:text-blue-200",
        }
      case "maybe-declined":
        return {
          bgColor: "bg-purple-100 dark:bg-purple-900/30",
          textColor: "text-purple-800 dark:text-purple-200",
        }
      default:
        return {
          bgColor: "bg-gray-100 dark:bg-gray-800",
          textColor: "text-gray-800 dark:text-gray-200",
        }
    }
  }

  const styles = getDecisionStyles()

  // Set up spring for the card with more responsive settings
  const [{ x, y, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    config: { tension: 800, friction: 15, mass: 0.1 },
  }))

  // Set up spring for the emoji
  const [{ rotate: emojiRotate }, emojiApi] = useSpring(() => ({
    rotate: 0,
    config: { tension: 200, friction: 10 },
  }))

  // Start the thinking animation
  emojiApi.start({
    from: { rotate: -10 },
    to: { rotate: 10 },
    loop: { reverse: true },
    config: { duration: 1000 },
  })

  // Set up drag gesture with direct position updates
  const bind = useDrag(
    ({ down, movement: [mx, my], last, velocity, first }) => {
      // Don't process if card has already been swiped
      if (swiped) return

      // On first touch, reset any existing movement
      if (first) {
        positionRef.current = { x: 0, y: 0, rotation: 0 }
      }

      // Determine swipe direction for visual indicator
      const dir = mx < 0 ? "left" : "right"
      setSwipeDirection(dir)

      // If released and moved enough, dismiss the card
      const swipeThreshold = 50 // Lower threshold for result cards
      if (!down && last && (Math.abs(mx) > swipeThreshold || Math.abs(my) > swipeThreshold)) {
        // Mark as swiped to prevent further interactions
        setSwiped(true)

        // Animate the card off screen with velocity for natural feel
        const xDest = mx < 0 ? -2000 : 2000
        const rotation = mx < 0 ? -30 : 30

        api.start({
          x: xDest,
          y: 0,
          rotate: rotation,
          config: {
            friction: 20,
            tension: 2000,
            velocity: [velocity[0] * 20, velocity[1] * 20], // Use velocity for more natural animation
          },
          onRest: () => {
            // Call onDismiss after the animation completes
            onDismiss()
          },
        })
        return
      }

      // Update card position and rotation during drag
      if (down) {
        // Apply a multiplier to make the card move faster than the mouse if needed
        // Using 1.0 for exact 1:1 movement, can increase to make it move faster
        const movementMultiplier = 1.0

        // Update position directly without any smoothing or delay
        positionRef.current = {
          x: mx * movementMultiplier,
          y: my * movementMultiplier,
          rotation: mx / 20,
        }

        // Apply the position directly to the spring
        api.start({
          x: positionRef.current.x,
          y: positionRef.current.y,
          rotate: positionRef.current.rotation,
          scale: 1.02,
          immediate: true, // This is critical for direct movement
        })
      } else {
        // Reset position if not swiped far enough
        api.start({
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          config: { tension: 500, friction: 30 },
        })
        setSwipeDirection(null)
      }
    },
    {
      enabled: active && !swiped,
      filterTaps: false, // Disable tap filtering for more immediate response
      rubberband: false, // Disable rubberband effect for direct control
      initial: [0, 0],
      bounds: { left: -1000, right: 1000, top: -1000, bottom: 1000 }, // Set large bounds
    },
  )

  return (
    <animated.div
      className={cn(
        "swipe-card",
        swipeDirection === "left" && "swipe-left",
        swipeDirection === "right" && "swipe-right",
        swiped && "pointer-events-none",
      )}
      style={{
        x,
        y,
        rotate,
        scale,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        touchAction: "none", // Prevent browser handling of touch gestures
        willChange: "transform", // Hint to browser to optimize transforms
      }}
      {...(active && !swiped ? bind() : {})}
    >
      <div
        className={cn(
          "swipe-card-content",
          isDark ? "glass-card-dark" : "glass-card",
          "flex flex-col justify-between shadow-lg",
        )}
      >
        <div className="swipe-indicator">
          <div className="swipe-indicator-item swipe-indicator-left">Dismiss</div>
          <div className="swipe-indicator-item swipe-indicator-right">Dismiss</div>
        </div>

        <div className="mb-4">
          <span
            className={cn("inline-block px-3 py-1 rounded-full text-xs font-medium", styles.bgColor, styles.textColor)}
          >
            Processing
          </span>
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
              🤔
            </span>
          </animated.div>
          <p className={cn("text-lg font-medium mb-2", styles.textColor)}>Thinking of an excuse...</p>
        </div>

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          Please wait while I come up with something creative
        </div>
      </div>
    </animated.div>
  )
}
