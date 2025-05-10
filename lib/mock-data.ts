import type { CalendarEvent } from "@/types/events"

// Generate random future date within the next 14 days
function getRandomFutureDate() {
  const now = new Date()
  const futureDate = new Date(now)
  futureDate.setDate(now.getDate() + Math.floor(Math.random() * 14) + 1)
  futureDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 4) * 15, 0)
  return futureDate.toISOString()
}

// Generate end time based on start time (1-2 hours later)
function getEndTime(startTime: string) {
  const start = new Date(startTime)
  const end = new Date(start)
  end.setHours(start.getHours() + 1 + Math.floor(Math.random() * 2))
  return end.toISOString()
}

// Mock calendar events
export const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Coffee with Maria",
    description: "Catch up on the latest project developments and discuss next steps.",
    startTime: getRandomFutureDate(),
    endTime: getRandomFutureDate(),
    location: "Starbucks Downtown",
    type: "Meeting",
  },
  {
    id: "2",
    title: "Team Standup",
    description: "Daily team standup to discuss progress and blockers.",
    startTime: getRandomFutureDate(),
    endTime: getRandomFutureDate(),
    location: "Conference Room A",
    type: "Work",
  },
  {
    id: "3",
    title: "Dentist Appointment",
    description: "Regular checkup and cleaning.",
    startTime: getRandomFutureDate(),
    endTime: getRandomFutureDate(),
    location: "Downtown Dental",
    type: "Personal",
  },
  {
    id: "4",
    title: "Birthday Party",
    description: "Alex's surprise birthday party. Don't forget to bring a gift!",
    startTime: getRandomFutureDate(),
    endTime: getRandomFutureDate(),
    location: "Rooftop Bar",
    type: "Social",
  },
  {
    id: "5",
    title: "Product Demo",
    description: "Presenting the new features to the client.",
    startTime: getRandomFutureDate(),
    endTime: getRandomFutureDate(),
    location: "Client Office",
    type: "Work",
  },
  {
    id: "6",
    title: "Yoga Class",
    description: "Weekly yoga session to destress.",
    startTime: getRandomFutureDate(),
    endTime: getRandomFutureDate(),
    location: "Zen Studio",
    type: "Personal",
  },
  {
    id: "7",
    title: "Dinner with Parents",
    description: "Monthly family dinner.",
    startTime: getRandomFutureDate(),
    endTime: getRandomFutureDate(),
    location: "Mom's House",
    type: "Family",
  },
  {
    id: "8",
    title: "Quarterly Review",
    description: "Performance review with manager.",
    startTime: getRandomFutureDate(),
    endTime: getRandomFutureDate(),
    location: "Manager's Office",
    type: "Work",
  },
]

// Generate more consistent dates for testing
export function generateTestEvents(): CalendarEvent[] {
  const events = [...mockEvents]

  // Ensure each event has a proper start and end time
  return events.map((event, index) => {
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(now.getDate() + index + 1)
    startDate.setHours(9 + (index % 8), 0, 0)

    const startTime = startDate.toISOString()
    const endTime = getEndTime(startTime)

    return {
      ...event,
      startTime,
      endTime,
    }
  })
}
