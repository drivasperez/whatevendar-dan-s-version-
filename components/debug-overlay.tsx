"use client"

import { useState, useEffect } from "react"

interface DebugOverlayProps {
  enabled?: boolean
}

export function DebugOverlay({ enabled = false }: DebugOverlayProps) {
  const [showDebug, setShowDebug] = useState(enabled)
  const [debugInfo, setDebugInfo] = useState({
    swipeThreshold: 100,
    lastSwipeDirection: "none",
    lastSwipeDistance: 0,
  })

  // Toggle debug overlay with Ctrl+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault()
        setShowDebug((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (!showDebug) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 text-white p-4 z-50 font-mono text-xs">
      <div className="max-w-3xl mx-auto">
        <h3 className="text-sm font-bold mb-2">Debug Info (Press Ctrl+D to toggle)</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>Swipe Threshold: {debugInfo.swipeThreshold}px</div>
          <div>Last Swipe Direction: {debugInfo.lastSwipeDirection}</div>
          <div>Last Swipe Distance: {debugInfo.lastSwipeDistance}px</div>
        </div>
      </div>
    </div>
  )
}
