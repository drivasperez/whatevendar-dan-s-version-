"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { CalendarEvent, EventDecision } from "@/types/events"
import { generateTestEvents } from "@/lib/mock-data"

interface EventsContextType {
  events: CalendarEvent[]
  decisions: EventDecision[]
  addDecision: (decision: EventDecision) => void
  clearDecisions: () => void
  resetEvents: () => void
}

const EventsContext = createContext<EventsContextType | undefined>(undefined)

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [decisions, setDecisions] = useState<EventDecision[]>([])

  // Load mock events on mount
  useEffect(() => {
    // Use the test events for more consistent dates
    setEvents(generateTestEvents())

    // Load decisions from localStorage if available
    const savedDecisions = localStorage.getItem("eventDecisions")
    if (savedDecisions) {
      try {
        setDecisions(JSON.parse(savedDecisions))
      } catch (e) {
        console.error("Failed to parse saved decisions", e)
      }
    }
  }, [])

  // Save decisions to localStorage when they change
  useEffect(() => {
    if (decisions.length > 0) {
      localStorage.setItem("eventDecisions", JSON.stringify(decisions))
    }
  }, [decisions])

  // Add decision and remove event from events list
  const addDecision = useCallback((decision: EventDecision) => {
    // Add to decisions history
    setDecisions((prev) => [decision, ...prev])

    // Remove the event from the events list
    setEvents((prev) => prev.filter((event) => event.id !== decision.eventId))
  }, [])

  const clearDecisions = useCallback(() => {
    setDecisions([])
    localStorage.removeItem("eventDecisions")
  }, [])

  // Reset events for testing
  const resetEvents = useCallback(() => {
    setEvents(generateTestEvents())
  }, [])

  return (
    <EventsContext.Provider value={{ events, decisions, addDecision, clearDecisions, resetEvents }}>
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
