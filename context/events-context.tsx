"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { CalendarEvent, EventDecision } from "@/types/events"

interface EventsContextType {
  events: CalendarEvent[]
  decisions: EventDecision[]
  addDecision: (decision: EventDecision) => void
  clearDecisions: () => void
  resetEvents: () => void
  isLoading: boolean
  error: string | null
}

const EventsContext = createContext<EventsContextType | undefined>(undefined)

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [decisions, setDecisions] = useState<EventDecision[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load events from Google Calendar
  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/calendar/events')
      if (!response.ok) {
        if (response.status === 401) {
          setError('Please connect your Google Calendar first')
          return
        }
        throw new Error('Failed to fetch events')
      }
      const data = await response.json()
      setEvents(data.events || [])
    } catch (e) {
      console.error('Failed to fetch events:', e)
      setError('Failed to load events. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load events on mount
  useEffect(() => {
    fetchEvents()

    // Load decisions from localStorage if available
    const savedDecisions = localStorage.getItem("eventDecisions")
    if (savedDecisions) {
      try {
        setDecisions(JSON.parse(savedDecisions))
      } catch (e) {
        console.error("Failed to parse saved decisions", e)
      }
    }
  }, [fetchEvents])

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

  // Reset events by fetching them again
  const resetEvents = useCallback(() => {
    fetchEvents()
  }, [fetchEvents])

  return (
    <EventsContext.Provider value={{ events, decisions, addDecision, clearDecisions, resetEvents, isLoading, error }}>
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
