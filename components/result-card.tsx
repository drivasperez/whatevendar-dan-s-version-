"use client"

import { useState, useEffect, useRef } from "react"
import { animated, useSpring } from "@react-spring/web"
import { useDrag } from "@use-gesture/react"
import { cn } from "@/lib/utils"
import { X, HelpCircle, Check } from "lucide-react"
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
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPosRef = useRef({ x: 0, y: 0 })
  const isSelectingTextRef = useRef(false)

  // Set up spring for the card
  const [{ x, y, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    config: { tension: 300, friction: 30 },
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

  // Set up drag gesture - simpler than event card since any direction dismisses
  const bind = useDrag(
    ({ down, movement: [mx, my], last }) => {
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

        // Animate the card off screen
        const xDest = mx < 0 ? -2000 : 2000
        const rotation = mx < 0 ? -30 : 30

        api.start({
          x: xDest,
          y: 0,
          rotate: rotation,
          config: { friction: 50, tension: 200 },
          onRest: () => {
            // Call onDismiss after the animation completes
            onDismiss()
          },
        })
        return
      }

      // Update card position and rotation during drag
      if (down) {
        api.start({
          x: mx,
          y: my,
          rotate: mx / 10,
          scale: 1.05,
          immediate: true,
        })
      } else {
        // Reset position if not swiped far enough
        api.start({
          x: 0,
          y: 0,
          rotate: 0,
          scale: active ? 1 : 0.9,
        })
        setSwipeDirection(null)
      }
    },
    { enabled: active && !swiped },
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
          <span className={cn("inline-block px-3 py-1 rounded-full text-xs font-medium", badge.bg, badge.text)}>
            {badge.label}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center flex-grow">
          <div className={cn("rounded-full p-4 mb-4", bgColor)}>{icon}</div>
          <h3 className="text-2xl font-bold mb-3">{title}</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg w-full">
            <p className="text-gray-700 dark:text-gray-300 italic">"{reason}"</p>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">Swipe in any direction to continue</div>
      </div>
    </animated.div>
  )
}
