"use client"

import { useState } from "react"
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
    config: { tension: 500, friction: 25, mass: 0.5 },
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

  // Set up drag gesture with immediate response
  const bind = useDrag(
    ({ down, movement: [mx, my], last, velocity }) => {
      // Don't process if card has already been swiped
      if (swiped) return

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
            friction: 50,
            tension: 200,
            velocity: [velocity[0] * 2, velocity[1] * 2], // Use velocity for more natural animation
          },
          onRest: () => {
            // Call onDismiss after the animation completes
            onDismiss()
          },
        })
        return
      }

      // Update card position and rotation during drag - use immediate: true for 1:1 movement
      if (down) {
        api.start({
          x: mx,
          y: my,
          rotate: mx / 15, // Reduced rotation for more natural feel
          scale: 1.02, // Subtle scale effect
          immediate: true, // This is key for 1:1 movement with the mouse
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
      filterTaps: true,
      rubberband: true,
      initial: [0, 0],
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
