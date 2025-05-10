"use client"

import { useEffect, useRef } from "react"
import confetti from "canvas-confetti"

interface ConfettiEffectProps {
  active: boolean
}

export function ConfettiEffect({ active }: ConfettiEffectProps) {
  const confettiRef = useRef<HTMLCanvasElement>(null)
  const confettiInstanceRef = useRef<confetti.CreateTypes | null>(null)

  useEffect(() => {
    // Initialize confetti when component mounts
    if (confettiRef.current && !confettiInstanceRef.current) {
      confettiInstanceRef.current = confetti.create(confettiRef.current, {
        resize: true,
        useWorker: true,
      })
    }

    // Clean up when component unmounts
    return () => {
      if (confettiInstanceRef.current) {
        confettiInstanceRef.current.reset()
      }
    }
  }, [])

  useEffect(() => {
    if (active && confettiInstanceRef.current) {
      // Fire multiple confetti bursts for a more impressive effect
      const duration = 3000
      const end = Date.now() + duration

      // First burst - from bottom center
      confettiInstanceRef.current({
        particleCount: 100,
        spread: 120,
        origin: { y: 0.9, x: 0.5 },
        colors: ["#FF5E5B", "#D8D8D8", "#7189FF", "#C5EBFE", "#B98EFF"],
      })

      // Second burst - from left
      setTimeout(() => {
        if (confettiInstanceRef.current) {
          confettiInstanceRef.current({
            particleCount: 50,
            angle: 60,
            spread: 80,
            origin: { x: 0, y: 0.5 },
            colors: ["#FF5E5B", "#D8D8D8", "#7189FF", "#C5EBFE", "#B98EFF"],
          })
        }
      }, 250)

      // Third burst - from right
      setTimeout(() => {
        if (confettiInstanceRef.current) {
          confettiInstanceRef.current({
            particleCount: 50,
            angle: 120,
            spread: 80,
            origin: { x: 1, y: 0.5 },
            colors: ["#FF5E5B", "#D8D8D8", "#7189FF", "#C5EBFE", "#B98EFF"],
          })
        }
      }, 400)

      // Continuous small bursts
      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval)
          return
        }

        if (confettiInstanceRef.current) {
          // Random position for each burst
          const x = Math.random()
          confettiInstanceRef.current({
            particleCount: 20,
            angle: 90 + (x > 0.5 ? 30 : -30),
            spread: 50,
            origin: { y: 0.7, x },
            colors: ["#FF5E5B", "#D8D8D8", "#7189FF", "#C5EBFE", "#B98EFF"],
          })
        }
      }, 300)

      return () => {
        clearInterval(interval)
      }
    }
  }, [active])

  return (
    <canvas
      ref={confettiRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: "100vw", height: "100vh" }}
    />
  )
}
