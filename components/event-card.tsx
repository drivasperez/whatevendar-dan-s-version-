"use client"

import { useState, useRef } from "react"
import { animated, useSpring } from "@react-spring/web"
import { useDrag } from "@use-gesture/react"
import type { CalendarEvent } from "@/types/events"
import { cn } from "@/lib/utils"
import { Calendar, Clock, MapPin, Check, X, HelpCircle } from "lucide-react"

interface EventCardProps {
  event: CalendarEvent
  onSwipe: (direction: "left" | "right" | "up", event: CalendarEvent) => void
  active: boolean
  index: number
}

export function EventCard({ event, onSwipe, active, index }: EventCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | "up" | null>(null)
  const [swiped, setSwiped] = useState(false)

  // Use a ref to track the current position directly
  const positionRef = useRef({ x: 0, y: 0, rotation: 0 })

  const getIndicatorScale = (direction: "left" | "right" | "up" | null, x: number) => {
    if (!direction) return 1

    // Base scale when not moving
    const baseScale = 1

    // Calculate scale based on x position
    // For left swipe, scale up the left indicator as x becomes more negative
    if (direction === "left") {
      return baseScale + Math.min(Math.abs(x) / 200, 0.5)
    }
    // For right swipe, scale up the right indicator as x becomes more positive
    else if (direction === "right") {
      return baseScale + Math.min(Math.abs(x) / 200, 0.5)
    }
    // For up swipe, scale up the up indicator as y becomes more negative
    else if (direction === "up") {
      return baseScale + Math.min(Math.abs(x) / 200, 0.3)
    }

    return baseScale
  }

  // Set up spring for the card with more responsive settings
  const [{ x, y, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: active ? 1 : 0.9,
    // Use a more responsive config for immediate feedback
    config: { tension: 800, friction: 15, mass: 0.1 },
  }))

  // Set up drag gesture with direct position updates
  const bind = useDrag(
    ({ down, movement: [mx, my], last, velocity, first }) => {
      // Don't process if card has already been swiped
      if (swiped) return

      // On first touch, reset any existing movement
      if (first) {
        positionRef.current = { x: 0, y: 0, rotation: 0 }
      }

      // Determine swipe direction based on movement
      const swipeThreshold = 80 // Lower threshold to make swiping easier
      const isSwipingLeft = mx < -swipeThreshold
      const isSwipingRight = mx > swipeThreshold
      const isSwipingUp = my < -swipeThreshold

      // Determine direction for visual indicator
      let dir: "left" | "right" | "up" | null = null
      if (Math.abs(mx) > Math.abs(my)) {
        dir = mx < 0 ? "left" : "right"
      } else if (my < 0) {
        dir = "up"
      }

      // Update swipe direction indicator
      setSwipeDirection(dir)

      // If we're not holding down and we've moved enough in a direction, trigger swipe
      if (!down && last) {
        if (isSwipingLeft || isSwipingRight || isSwipingUp) {
          // Mark as swiped to prevent further interactions
          setSwiped(true)

          // Determine final swipe direction
          let finalDirection: "left" | "right" | "up"
          if (isSwipingUp) {
            finalDirection = "up"
          } else {
            finalDirection = isSwipingLeft ? "left" : "right"
          }

          // Animate the card off screen with velocity for natural feel
          const xDest = finalDirection === "left" ? -2000 : finalDirection === "right" ? 2000 : 0
          const yDest = finalDirection === "up" ? -2000 : 0
          const rotation = finalDirection === "left" ? -30 : finalDirection === "right" ? 30 : 0

          api.start({
            x: xDest,
            y: yDest,
            rotate: rotation,
            config: {
              friction: 50,
              tension: 200,
              velocity: [velocity[0] * 2, velocity[1] * 2], // Use velocity for more natural animation
            },
            onRest: () => {
              // Call onSwipe after the animation completes
              onSwipe(finalDirection, event)
            },
          })
          return
        } else {
          // If not swiping far enough, reset position
          api.start({
            x: 0,
            y: 0,
            rotate: 0,
            scale: active ? 1 : 0.9,
            config: { tension: 500, friction: 30 },
          })
          setSwipeDirection(null)
        }
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

  // Format date for display
  const eventDate = new Date(event.startTime)
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  return (
    <animated.div
      className={cn(
        "swipe-card",
        swipeDirection === "left" && "swipe-left",
        swipeDirection === "right" && "swipe-right",
        swipeDirection === "up" && "swipe-up",
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
        className={cn("swipe-card-content", "glass-card", "flex flex-col justify-between shadow-lg")}
        style={{ position: "relative", zIndex: 1 }} // Ensure card content is above bubbles
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
            <div className="indicator-icon decline-icon">
              <X className="h-5 w-5 text-white" />
            </div>
          </div>

          <div
            className="swipe-indicator-item swipe-indicator-up"
            style={{
              opacity: swipeDirection === "up" ? 1 : 0,
              transform: `translateX(-50%) scale(${getIndicatorScale(
                "up",
                swipeDirection === "up" ? positionRef.current.y : 0,
              )})`,
            }}
          >
            <div className="indicator-icon maybe-icon">
              <HelpCircle className="h-5 w-5 text-white" />
            </div>
          </div>

          <div
            className="swipe-indicator-item swipe-indicator-right"
            style={{
              opacity: swipeDirection === "right" ? 1 : 0,
              transform: `scale(${getIndicatorScale("right", swipeDirection === "right" ? positionRef.current.x : 0)})`,
            }}
          >
            <div className="indicator-icon accept-icon">
              <Check className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <span className="event-type-badge">{event.type}</span>
        </div>

        <h3 className="text-2xl font-bold mb-2 font-old-standard">{event.title}</h3>

        <div className="card-divider"></div>

        <div className="grid grid-cols-1 gap-2 mb-6 w-full">
          <div className="info-item">
            <div className="info-item-icon">
              <Calendar className="h-4 w-4" />
            </div>
            <span className="text-gray-700">{formattedDate}</span>
          </div>
          <div className="info-item">
            <div className="info-item-icon">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-gray-700">{formattedTime}</span>
          </div>
          {event.location && (
            <div className="info-item">
              <div className="info-item-icon">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="text-gray-700">{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="description-box mb-4">
            <p className="text-gray-600 text-sm">{event.description}</p>
          </div>
        )}

        <div className="swipe-instructions">Swipe left to decline, right to accept, or up for maybe</div>
      </div>
    </animated.div>
  )
}
