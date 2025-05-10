import { Loader2 } from "lucide-react"

export function LoadingEvents() {
  return (
    <div className="w-full h-[500px] flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      <p className="mt-4 text-gray-500">Loading events...</p>
    </div>
  )
}

export function LoadingHistory() {
  return (
    <div className="w-full h-[70vh] flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      <p className="mt-4 text-gray-500">Loading history...</p>
    </div>
  )
}
