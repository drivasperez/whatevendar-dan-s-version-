export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  type: string
}

export interface EventDecision {
  eventId: string
  event: CalendarEvent
  decision: "declined" | "maybe" | "maybe-declined"
  comment?: string
  excuse?: string
  timestamp: string
}
