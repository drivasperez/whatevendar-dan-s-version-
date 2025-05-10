"use client"

import { useState, useEffect, useRef } from "react"
import { animated, useSpring } from "@react-spring/web"
import { useDrag } from "@use-gesture/react"
import { cn } from "@/lib/utils"
import { X, HelpCircle, Check, ArrowRight, ArrowLeft } from "lucide-react"
import { useTheme } from "next-themes"

interface ResultCardProps {
  decision: "declined" | "maybe" | "maybe-declined"
  reason: string
  onDismiss: () => void
  active: boolean
  index: number
}

export function ResultCard({ decision, reason, onDismiss, active, index }: ResultCardProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const [swiped, setSwiped] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

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

  // Set up spring for the card with more responsive settings
  const [{ x, y, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    config: { tension: 800, friction: 15, mass: 0.1 },
  }))

  // Animate in when component mounts
  useEffect(() => {
    api.start({
      scale: 1,
      opacity: 1,
      config: { tension: 300, friction: 30 },
    })
    setIsVisible(true)
  }, [api])

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
          scale: active ? 1 : 0.9,
          config: { tension: 500, friction: 30 },
        })
        setSwipeDirection(null)
      }
    },
    {
      enabled: active && !swiped,
      filterTaps: false, // Disable tap filtering for more immediate response
      rubberband: false, // Disable rubberband effect for direct control
      from: [0, 0],
      bounds: { left: -1000, right: 1000, top: -1000, bottom: 1000 }, // Set large bounds
    },
  )

  // Get the appropriate icon and colors based on decision
  const getDecisionDetails = () => {
    switch (decision) {
      case "declined":
        return {
          icon: <X className="h-8 w-8 text-white" />,
          bgColor: "bg-red-500",
          title: "Event Declined",
          badge: {
            bg: "bg-red-100 dark:bg-red-900/30",
            text: "text-red-800 dark:text-red-200",
            label: "Declined",
          },
        }
      case "maybe":
        return {
          icon: <HelpCircle className="h-8 w-8 text-white" />,
          bgColor: "bg-blue-500",
          title: "Event Marked as Maybe",
          badge: {
            bg: "bg-blue-100 dark:bg-blue-900/30",
            text: "text-blue-800 dark:text-blue-200",
            label: "Maybe",
          },
        }
      case "maybe-declined":
        return {
          icon: <X className="h-8 w-8 text-white" />,
          bgColor: "bg-purple-500",
          title: "Maybe → Declined",
          badge: {
            bg: "bg-purple-100 dark:bg-purple-900/30",
            text: "text-purple-800 dark:text-purple-200",
            label: "Maybe → Declined",
          },
        }
      default:
        return {
          icon: <Check className="h-8 w-8 text-white" />,
          bgColor: "bg-gray-500",
          title: "Decision Made",
          badge: {
            bg: "bg-gray-100 dark:bg-gray-800",
            text: "text-gray-800 dark:text-gray-200",
            label: "Processed",
          },
        }
    }
  }

  const { icon, bgColor, title, badge } = getDecisionDetails()

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
        zIndex: active ? 5 : 5 - index,
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
              <ArrowLeft className="h-5 w-5 text-white" />
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
          <span className={cn("event-type-badge", badge.text)}>{badge.label}</span>
        </div>

        <div className="flex flex-col items-center justify-center flex-grow">
          <div className={cn("rounded-full p-4 mb-4 shadow-lg", bgColor)}>{icon}</div>
          <h3 className="text-2xl font-bold mb-3">{title}</h3>

          <div className="card-divider"></div>

          <div className="description-box w-full">
            <p className="text-gray-700 dark:text-gray-300 italic">"{reason}"</p>
          </div>
        </div>

        <div className="swipe-instructions">Swipe in any direction to continue</div>
      </div>
    </animated.div>
  )
}
