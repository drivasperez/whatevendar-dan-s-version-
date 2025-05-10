"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { CalendarEvent } from "@/types/events"

interface Decision {
  eventId: string
  event: CalendarEvent
  decision: "declined" | "maybe" | "maybe-declined"
  reason: string
  timestamp: string
}

interface EventsContextType {
  events: CalendarEvent[]
  currentEvent: CalendarEvent | null
  decisions: Decision[]
  addDecision: (decision: Decision) => void
  clearDecisions: () => void
  resetEvents: () => void
  hasMoreEvents: boolean
}

const EventsContext = createContext<EventsContextType | undefined>(undefined)

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null)
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMoreEvents, setHasMoreEvents] = useState(true)

  // Load events from API
  const loadEvents = useCallback(async () => {
    if (isLoading || !hasMoreEvents) return // Prevent concurrent loads and unnecessary reloads
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/calendar/events')
      const data = await response.json()
      if (data.events) {
        // Filter out events that have already been decided
        const decidedEventIds = new Set(decisions.map(d => d.eventId))
        const newEvents = data.events.filter((event: CalendarEvent) => !decidedEventIds.has(event.id))
        
        setEvents(newEvents)
        setCurrentEvent(newEvents[0] || null)
        setHasMoreEvents(newEvents.length > 0)
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMoreEvents, decisions])

  // Move to next event
  const moveToNextEvent = useCallback(() => {
    if (events.length <= 1) {
      setCurrentEvent(null)
      setHasMoreEvents(false)
      return
    }

    // Remove the current event and set the next one
    const newEvents = events.slice(1)
    setEvents(newEvents)
    setCurrentEvent(newEvents[0])
  }, [events])

  // Load events initially
  useEffect(() => {
    if (events.length === 0 && hasMoreEvents) {
      loadEvents()
    }
  }, [events.length, hasMoreEvents, loadEvents])

  const addDecision = (decision: Decision) => {
    setDecisions((prev) => [...prev, decision])
    // Move to the next event
    moveToNextEvent()
  }

  const clearDecisions = () => {
    setDecisions([])
    setHasMoreEvents(true) // Reset the flag when clearing decisions
  }

  const resetEvents = useCallback(() => {
    // Only reset if we have no more events
    if (!hasMoreEvents) {
      setEvents([])
      setCurrentEvent(null)
      setHasMoreEvents(true)
      loadEvents()
    }
  }, [hasMoreEvents, loadEvents])

  return (
    <EventsContext.Provider
      value={{
        events,
        currentEvent,
        decisions,
        addDecision,
        clearDecisions,
        resetEvents,
        hasMoreEvents,
      }}
    >
      {children}
    </EventsContext.Provider>
  )
}

export function useEvents() {
  const context = useContext(EventsContext)
  if (context === undefined) {
    throw new Error("useEvents must be used within an EventsProvider")
  }
  return context
}
