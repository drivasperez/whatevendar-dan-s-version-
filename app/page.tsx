import { EventSwiper } from "@/components/event-swiper"
import { CalendarAuth } from "@/components/calendar-auth"
import { TestControls } from "@/components/test-controls"

export default function Home() {
  return (
    <main className="flex h-screen items-center justify-center animated-gradient-bg overflow-hidden">
      <div className="w-full max-w-md flex items-center justify-center">
        <EventSwiper />
      </div>
      <TestControls />
    </main>
  )
}
