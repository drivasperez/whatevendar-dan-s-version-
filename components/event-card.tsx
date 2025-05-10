"use client"

import { useState, useRef, useEffect } from "react"
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
  shouldBounce?: boolean
  xThreshold?: number // Configurable threshold
}

export function EventCard({
  event,
  onSwipe,
  active,
  index,
  shouldBounce = false,
  xThreshold = 100, // Default threshold value
}: EventCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | "up" | null>(null)
  const [swiped, setSwiped] = useState(false)
  const [hasBounced, setHasBounced] = useState(false)
  const [swipeCommitted, setSwipeCommitted] = useState(false) // Track if swipe is committed
  const [swipeProgress, setSwipeProgress] = useState(0) // Track swipe progress (0-1)

  // Use refs to track the current position and velocity
  const positionRef = useRef({ x: 0, y: 0, rotation: 0 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const lastMoveTimeRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)

  // Commit threshold - percentage of xThreshold where swipe becomes committed
  const commitThresholdPercent = 0.7 // 70% of xThreshold

  // Velocity threshold - minimum velocity to commit a swipe even if distance is below threshold
  const velocityCommitThreshold = 0.5 // px/ms

  const getIndicatorScale = (direction: "left" | "right" | "up" | null, x: number, y: number) => {
    if (!direction) return 1

    // Base scale when not moving
    const baseScale = 1

    // Calculate progress based on direction
    let progress = 0
    if (direction === "left" || direction === "right") {
      progress = Math.min(Math.abs(x) / xThreshold, 1)
    } else if (direction === "up") {
      progress = Math.min(Math.abs(y) / xThreshold, 1)
    }

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

  // Set up spring for the card with more responsive settings
  const [{ x, y, rotate, scale, opacity }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: active ? 1 : 0.9,
    opacity: 1,
    config: { tension: 800, friction: 15, mass: 0.1 },
  }))

  // Apply bounce animation when a card becomes active
  useEffect(() => {
    if (active && shouldBounce && !hasBounced) {
      // Start with a slight scale down
      api.start({
        scale: 0.95,
        config: { tension: 300, friction: 10 },
        immediate: true,
      })

      // Then bounce up with a spring effect immediately
      api.start({
        scale: 1,
        config: {
          tension: 800, // Increased tension for faster animation
          friction: 8, // Reduced friction for faster bounce
          mass: 0.5, // Reduced mass for quicker movement
        },
      })
      setHasBounced(true)
    } else if (!active) {
      // Reset bounce state when card becomes inactive
      setHasBounced(false)
      api.start({
        scale: 0.9,
        config: { tension: 800, friction: 15, mass: 0.1 },
      })
    }
  }, [active, shouldBounce, hasBounced, api])

  // Function to complete swipe animation
  const completeSwipe = (direction: "left" | "right" | "up", velocity: { x: number; y: number }) => {
    if (swiped) return // Prevent duplicate swipes

    setSwiped(true)
    setSwipeCommitted(false)

    // Calculate destination based on screen dimensions and velocity
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    // Use velocity to determine how far off-screen to animate
    // Higher velocity = further off-screen for more natural feel
    const velocityMultiplier = 0.8 // Increased for more responsive feel
    const xVelocityOffset = Math.abs(velocity.x) * velocityMultiplier * screenWidth
    const yVelocityOffset = Math.abs(velocity.y) * velocityMultiplier * screenHeight

    // Ensure minimum distance off-screen (2x screen width/height)
    const minOffscreenX = screenWidth * 2
    const minOffscreenY = screenHeight * 2

    // Calculate final destination
    const xDest =
      direction === "left"
        ? -Math.max(minOffscreenX, xVelocityOffset)
        : direction === "right"
          ? Math.max(minOffscreenX, xVelocityOffset)
          : 0

    const yDest = direction === "up" ? -Math.max(minOffscreenY, yVelocityOffset) : 0

    // Calculate rotation based on direction and velocity
    const rotationFactor = 45 // Maximum rotation in degrees (increased for more visual feedback)
    const rotation = direction === "left" ? -rotationFactor : direction === "right" ? rotationFactor : 0

    // Animate the card off screen with enhanced configuration
    api.start({
      x: xDest,
      y: yDest,
      rotate: rotation,
      scale: 0.8, // Scale down as it leaves
      opacity: 0.5, // Fade out as it leaves
      config: {
        duration: 500, // Ensure minimum animation duration
        easing: (t) => 1 - Math.pow(1 - t, 3), // Cubic ease-out for natural movement
      },
      onRest: () => {
        // Call onSwipe after the animation completes
        onSwipe(direction, event)
      },
    })
  }

  // Set up drag gesture with improved handling
  const bind = useDrag(
    ({ down, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], first, last, event }) => {
      // Don't process if card has already been swiped
      if (swiped) return

      // On first touch, reset state
      if (first) {
        positionRef.current = { x: 0, y: 0, rotation: 0 }
        velocityRef.current = { x: 0, y: 0 }
        lastMoveTimeRef.current = Date.now()
        setSwipeCommitted(false)
        setSwipeProgress(0)

        // Cancel any existing animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
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

      // Determine primary swipe direction
      let primaryDirection: "left" | "right" | "up" | null = null
      if (Math.abs(mx) > Math.abs(my)) {
        primaryDirection = mx < 0 ? "left" : "right"
      } else if (my < 0) {
        primaryDirection = "up"
      }

      // Update swipe direction indicator
      setSwipeDirection(primaryDirection)

      // Calculate swipe progress
      let progress = 0
      if (primaryDirection === "left" || primaryDirection === "right") {
        progress = Math.min(Math.abs(mx) / xThreshold, 1)
      } else if (primaryDirection === "up") {
        progress = Math.min(Math.abs(my) / xThreshold, 1)
      }
      setSwipeProgress(progress)

      // Check if swipe should be committed based on distance or velocity
      const isCommitDistance = progress >= commitThresholdPercent
      const isCommitVelocity =
        ((primaryDirection === "left" || primaryDirection === "right") &&
          velocityRef.current.x > velocityCommitThreshold) ||
        (primaryDirection === "up" && velocityRef.current.y > velocityCommitThreshold)

      const shouldCommit = isCommitDistance || isCommitVelocity

      // Once committed, stay committed
      if (shouldCommit && !swipeCommitted) {
        setSwipeCommitted(true)
      }

      // If we're not holding down anymore
      if (!down) {
        // If swipe is committed or exceeds threshold, complete the swipe
        if (
          swipeCommitted ||
          (primaryDirection === "left" && mx < -xThreshold) ||
          (primaryDirection === "right" && mx > xThreshold) ||
          (primaryDirection === "up" && my < -xThreshold)
        ) {
          if (primaryDirection) {
            completeSwipe(primaryDirection, velocityRef.current)
          }
        } else {
          // Reset position with a spring effect
          api.start({
            x: 0,
            y: 0,
            rotate: 0,
            scale: active ? 1 : 0.9,
            opacity: 1,
            config: { tension: 500, friction: 30 },
          })
          setSwipeDirection(null)
          setSwipeProgress(0)
        }
        return
      }

      // Update card position and rotation during drag with improved responsiveness
      if (down) {
        // Apply a multiplier to make the card move faster than the mouse
        const movementMultiplier = 1.2

        // Update position directly without any smoothing or delay
        positionRef.current = {
          x: mx * movementMultiplier,
          y: my * movementMultiplier,
          rotation: mx / 15, // Slightly more rotation for better visual feedback
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
      rubberband: true, // Enable rubberband effect for better feel at edges
      from: [0, 0],
      bounds: { left: -1000, right: 1000, top: -1000, bottom: 1000 }, // Set large bounds
    },
  )

  // Safety mechanism: detect and fix stuck cards
  useEffect(() => {
    if (swipeCommitted && !swiped && active) {
      // If a card is committed but not yet swiped, ensure it completes
      const safetyTimer = setTimeout(() => {
        if (swipeCommitted && !swiped && swipeDirection) {
          completeSwipe(swipeDirection, velocityRef.current)
        }
      }, 300) // Short delay to allow natural completion first

      return () => clearTimeout(safetyTimer)
    }
  }, [swipeCommitted, swiped, active, swipeDirection])

  // Clean up any animation frames on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

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
        swipeCommitted && "swipe-committed",
        swiped && "pointer-events-none",
      )}
      style={{
        x,
        y,
        rotate,
        scale,
        opacity,
        zIndex: active ? 5 : 5 - index,
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
      <div
        className={cn("swipe-card-content", "glass-card", "flex flex-col justify-between shadow-lg")}
        style={{ position: "relative", zIndex: 1 }} // Ensure card content is above bubbles
      >
        {/* Enhanced indicator design with progress feedback */}
        <div className="swipe-indicator">
          <div
            className="swipe-indicator-item swipe-indicator-left"
            style={{
              opacity: swipeDirection === "left" ? Math.min(swipeProgress * 1.5, 1) : 0,
              transform: `scale(${getIndicatorScale("left", positionRef.current.x, positionRef.current.y)})`,
            }}
          >
            <div className="indicator-icon decline-icon">
              <X className="h-5 w-5 text-white" />
            </div>
          </div>

          <div
            className="swipe-indicator-item swipe-indicator-up"
            style={{
              opacity: swipeDirection === "up" ? Math.min(swipeProgress * 1.5, 1) : 0,
              transform: `translateX(-50%) scale(${getIndicatorScale(
                "up",
                positionRef.current.x,
                positionRef.current.y,
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
              opacity: swipeDirection === "right" ? Math.min(swipeProgress * 1.5, 1) : 0,
              transform: `scale(${getIndicatorScale("right", positionRef.current.x, positionRef.current.y)})`,
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
