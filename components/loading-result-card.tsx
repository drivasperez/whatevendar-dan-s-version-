"use client"

import { useState, useRef } from "react"
import { animated, useSpring } from "@react-spring/web"
import { useDrag } from "@use-gesture/react"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"

interface LoadingResultCardProps {
  decision: "declined" | "maybe" | "maybe-declined"
  onDismiss: () => void
  active: boolean
  index: number
}

export function LoadingResultCard({ decision, onDismiss, active, index }: LoadingResultCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const [swiped, setSwiped] = useState(false)

  // Use a ref to track the current position directly
  const positionRef = useRef({ x: 0, y: 0, rotation: 0 })

  const getIndicatorScale = (direction: "left" | "right" | null, x: number) => {
    if (!direction) return 1

    // Base scale when not moving
    const baseScale = 1

    // Calculate scale based on x position
    if (direction === "left") {
      return baseScale + Math.min(Math.abs(x) / 200, 0.5)
    } else if (direction === "right") {
      return baseScale + Math.min(Math.abs(x) / 200, 0.5)
    }

    return baseScale
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
      <div className={cn("swipe-card-content", "glass-card", "flex flex-col justify-between shadow-lg")}>
        {/* New indicator design positioned at top corners */}
        <div className="swipe-indicator">
          <div
            className="swipe-indicator-item swipe-indicator-left"
            style={{
              opacity: swipeDirection === "left" ? 1 : 0,
              transform: `scale(${getIndicatorScale("left", swipeDirection === "left" ? positionRef.current.x : 0)})`,
            }}
          >
            <div className="indicator-icon continue-icon">
              <ArrowRight className="h-5 w-5 text-white" />
            </div>
          </div>

          <div
            className="swipe-indicator-item swipe-indicator-right"
            style={{
              opacity: swipeDirection === "right" ? 1 : 0,
              transform: `scale(${getIndicatorScale("right", swipeDirection === "right" ? positionRef.current.x : 0)})`,
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
              🤔
            </span>
          </animated.div>

          <div className="card-divider"></div>

          <p className={cn("text-lg font-medium mb-2", styles.textColor)}>Thinking of an excuse...</p>
        </div>

        <div className="swipe-instructions">Please wait while I come up with something creative</div>
      </div>
    </animated.div>
  )
}
