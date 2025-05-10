import { Suspense } from "react"
import { EventHistory } from "@/components/event-history"
import { LoadingHistory } from "@/components/loading"

export default function HistoryPage() {
  return (
    <main className="flex h-screen items-center justify-center animated-gradient-bg overflow-hidden">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
        <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 mb-6 font-old-standard">
          Your Decision History
        </h1>
        <Suspense fallback={<LoadingHistory />}>
          <div className="overflow-y-auto max-h-[80vh] px-4">
            <EventHistory />
          </div>
        </Suspense>
      </div>
    </main>
  )
}
