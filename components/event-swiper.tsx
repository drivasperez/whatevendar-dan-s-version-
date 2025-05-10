"use client"

import { useEvents } from "@/context/events-context"
import { EventCard } from "./event-card"
import { Button } from "./ui/button"
import { useToast } from "./ui/use-toast"
import { useState } from "react"

export function EventSwiper() {
  const { currentEvent, addDecision } = useEvents()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleDecision = async (decision: "declined" | "maybe" | "maybe-declined", reason: string) => {
    if (!currentEvent) return

    setIsLoading(true)
    try {
      addDecision({
        eventId: currentEvent.id,
        event: currentEvent,
        decision,
        reason,
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "Decision saved",
        description: `You ${decision} "${currentEvent.title}"`,
      })
    } catch (error) {
      console.error("Error saving decision:", error)
      toast({
        title: "Error",
        description: "Failed to save your decision. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentEvent) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
        <h2 className="text-2xl font-bold mb-4">No More Events</h2>
        <p className="text-muted-foreground mb-6">
          You've gone through all your upcoming events. Check back later for more!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <EventCard event={currentEvent} />
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => handleDecision("declined", "Not interested")}
          disabled={isLoading}
        >
          Decline
        </Button>
        <Button
          variant="outline"
          onClick={() => handleDecision("maybe", "Might be interested")}
          disabled={isLoading}
        >
          Maybe
        </Button>
        <Button
          variant="outline"
          onClick={() => handleDecision("maybe-declined", "Not sure yet")}
          disabled={isLoading}
        >
          Maybe Later
        </Button>
      </div>
    </div>
  )
}
