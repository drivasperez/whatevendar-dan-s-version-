import { Suspense } from "react"
import EventSwiper from "@/components/event-swiper"
import { LoadingEvents } from "@/components/loading"
import { TestControls } from "@/components/test-controls"

export default function Home() {
  return (
    <main className="flex h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <div className="w-full max-w-md flex items-center justify-center">
        <Suspense fallback={<LoadingEvents />}>
          <EventSwiper />
        </Suspense>
      </div>
      <TestControls />
    </main>
  )
}
