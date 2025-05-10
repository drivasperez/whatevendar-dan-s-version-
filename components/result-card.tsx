"use client"

import { useState, useEffect, useRef } from "react"
import { animated, useSpring } from "@react-spring/web"
import { useDrag } from "@use-gesture/react"
import { cn } from "@/lib/utils"
import { X, HelpCircle, Check, ArrowRight, ArrowLeft } from "lucide-react"

interface ResultCardProps {
  decision: "declined" | "maybe" | "maybe-declined"
  comment?: string // New field for the snarky comment
  excuse?: string // New field for the AI-generated excuse
  onDismiss: () => void
  active: boolean
  index: number
  xThreshold?: number // Configurable threshold
}

export function ResultCard({
  decision,
  comment, 
  excuse, 
  onDismiss,
  active,
  index,
  xThreshold = 50, // Lower default threshold for result cards
}: ResultCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const [swiped, setSwiped] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [swipeCommitted, setSwipeCommitted] = useState(false) // Track if swipe is committed
  const [swipeProgress, setSwipeProgress] = useState(0) // Track swipe progress (0-1)

  // Use the legacy 'reason' field if excuse/comment aren't provided
  const displayExcuse = excuse || ""
  const displayComment = comment || ""
        
  // Use refs to track the current position and velocity
  const positionRef = useRef({ x: 0, y: 0, rotation: 0 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const lastMoveTimeRef = useRef(0)
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Commit threshold - percentage of xThreshold where swipe becomes committed
  const commitThresholdPercent = 0.7 // 70% of xThreshold

  // Velocity threshold - minimum velocity to commit a swipe even if distance is below threshold
  const velocityCommitThreshold = 0.5 // px/ms

  const getIndicatorScale = (direction: "left" | "right" | null, x: number) => {
    if (!direction) return 1

    // Base scale when not moving
    const baseScale = 1

    // Calculate progress based on direction
    const progress = Math.min(Math.abs(x) / xThreshold, 1)

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
    scale: 1,
    opacity: 1,
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

  // Function to complete swipe animation
  const completeSwipe = (direction: "left" | "right", velocity: { x: number; y: number }) => {
    if (swiped) return // Prevent duplicate swipes

    setSwiped(true)
    setSwipeCommitted(false)

    // Clear any safety timers
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current)
      safetyTimerRef.current = null
    }

    // Calculate destination based on screen dimensions and velocity
    const screenWidth = window.innerWidth

    // Use velocity to determine how far off-screen to animate
    // Higher velocity = further off-screen for more natural feel
    const velocityMultiplier = 0.8 // Increased for more responsive feel
    const xVelocityOffset = Math.abs(velocity.x) * velocityMultiplier * screenWidth

    // Ensure minimum distance off-screen (2x screen width)
    const minOffscreenX = screenWidth * 2

    // Calculate final destination
    const xDest =
      direction === "left" ? -Math.max(minOffscreenX, xVelocityOffset) : Math.max(minOffscreenX, xVelocityOffset)

    // Calculate rotation based on direction and velocity
    const rotationFactor = 45 // Maximum rotation in degrees (increased for more visual feedback)
    const rotation = direction === "left" ? -rotationFactor : rotationFactor

    // Animate the card off screen with enhanced configuration
    api.start({
      x: xDest,
      y: 0,
      rotate: rotation,
      scale: 0.8, // Scale down as it leaves
      opacity: 0.5, // Fade out as it leaves
      config: {
        duration: 500, // Ensure minimum animation duration
        easing: (t) => 1 - Math.pow(1 - t, 3), // Cubic ease-out for natural movement
      },
      onRest: () => {
        // Call onDismiss after the animation completes
        onDismiss()
      },
    })
  }

  // Set up drag gesture with improved handling
  const bind = useDrag(
    ({ down, movement: [mx, my], velocity: [vx, vy], first, last }) => {
      // Don't process if card has already been swiped
      if (swiped) return

      // On first touch, reset state
      if (first) {
        positionRef.current = { x: 0, y: 0, rotation: 0 }
        velocityRef.current = { x: 0, y: 0 }
        lastMoveTimeRef.current = Date.now()
        setSwipeCommitted(false)
        setSwipeProgress(0)

        // Clear any existing safety timers
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current)
          safetyTimerRef.current = null
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

      // Determine swipe direction for visual indicator
      const dir = mx < 0 ? "left" : "right"
      setSwipeDirection(dir)

      // Calculate swipe progress
      const progress = Math.min(Math.abs(mx) / xThreshold, 1)
      setSwipeProgress(progress)

      // Check if swipe should be committed based on distance or velocity
      const isCommitDistance = progress >= commitThresholdPercent
      const isCommitVelocity = velocityRef.current.x > velocityCommitThreshold

      const shouldCommit = isCommitDistance || isCommitVelocity

      // Once committed, stay committed
      if (shouldCommit && !swipeCommitted) {
        setSwipeCommitted(true)
      }

      // If we're not holding down anymore
      if (!down) {
        // If swipe is committed or exceeds threshold, complete the swipe
        if (swipeCommitted || Math.abs(mx) > xThreshold) {
          completeSwipe(dir, velocityRef.current)
        } else {
          // Reset position with a spring effect
          api.start({
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            opacity: 1,
            config: { tension: 500, friction: 30 },
          })
          setSwipeDirection(null)
          setSwipeProgress(0)
        }
        return
      }

      // Update card position and rotation during drag
      if (down) {
        // Apply a multiplier to make the card move faster than the mouse
        const movementMultiplier = 1.2

        // Update position directly without any smoothing or delay
        positionRef.current = {
          x: mx * movementMultiplier,
          y: my * movementMultiplier,
          rotation: mx / 15,
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
      rubberband: true, // Enable rubberband effect for better feel
      from: [0, 0],
      bounds: { left: -1000, right: 1000, top: -1000, bottom: 1000 }, // Set large bounds
    },
  )

  // Safety mechanism: detect and fix stuck cards
  useEffect(() => {
    if (swipeCommitted && !swiped && active) {
      // If a card is committed but not yet swiped, ensure it completes
      safetyTimerRef.current = setTimeout(() => {
        if (swipeCommitted && !swiped && swipeDirection) {
          completeSwipe(swipeDirection, velocityRef.current)
        }
      }, 300) // Short delay to allow natural completion first

      return () => {
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current)
        }
      }
    }
  }, [swipeCommitted, swiped, active, swipeDirection])

  // Get the appropriate icon and colors based on decision
  const getDecisionDetails = () => {
    switch (decision) {
      case "declined":
        return {
          icon: <X className="h-8 w-8 text-white" />,
          bgColor: "bg-red-500",
          title: "Event Declined",
          badge: {
            bg: "bg-red-100",
            text: "text-red-800",
            label: "Declined",
          },
        }
      case "maybe":
        return {
          icon: <HelpCircle className="h-8 w-8 text-white" />,
          bgColor: "bg-blue-500",
          title: "Event Marked as Maybe",
          badge: {
            bg: "bg-blue-100",
            text: "text-blue-800",
            label: "Maybe",
          },
        }
      case "maybe-declined":
        return {
          icon: <X className="h-8 w-8 text-white" />,
          bgColor: "bg-purple-500",
          title: "Maybe → Declined",
          badge: {
            bg: "bg-purple-100",
            text: "text-purple-800",
            label: "Maybe → Declined",
          },
        }
      default:
        return {
          icon: <Check className="h-8 w-8 text-white" />,
          bgColor: "bg-gray-500",
          title: "Decision Made",
          badge: {
            bg: "bg-gray-100",
            text: "text-gray-800",
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
      <div className={cn("swipe-card-content", "glass-card", "flex flex-col justify-between shadow-lg")}>
        {/* Enhanced indicator design with progress feedback */}
        <div className="swipe-indicator">
          <div
            className="swipe-indicator-item swipe-indicator-left"
            style={{
              opacity: swipeDirection === "left" ? Math.min(swipeProgress * 1.5, 1) : 0,
              transform: `scale(${getIndicatorScale("left", positionRef.current.x)})`,
            }}
          >
            <div className="indicator-icon continue-icon">
              <ArrowLeft className="h-5 w-5 text-white" />
            </div>
          </div>

          <div
            className="swipe-indicator-item swipe-indicator-right"
            style={{
              opacity: swipeDirection === "right" ? Math.min(swipeProgress * 1.5, 1) : 0,
              transform: `scale(${getIndicatorScale("right", positionRef.current.x)})`,
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
            {displayComment && (
              <p className="text-gray-600 font-medium mb-2">{displayComment}</p>
            )}
            <p className="text-gray-700 italic">{displayExcuse}</p>
          </div>
        </div>

        <div className="swipe-instructions">Swipe in any direction to continue</div>
      </div>
    </animated.div>
  )
}
