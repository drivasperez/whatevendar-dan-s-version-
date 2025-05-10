"use client"

import { useEvents } from "@/context/events-context"
import { cn } from "@/lib/utils"
import { Calendar, Clock, MapPin, Frown, Meh } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"

export function EventHistory() {
  const { decisions, clearDecisions } = useEvents()

  if (decisions.length === 0) {
    return (
      <div className="w-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <Meh className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">No Decisions Yet</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
          Start swiping on events to see your history here.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={clearDecisions}>
          Clear History
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {decisions.map((decision) => {
          // Format date for display
          const eventDate = new Date(decision.event.startTime)
          const formattedDate = eventDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
          const formattedTime = eventDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })

          // Decision specific styling
          const getDecisionStyles = () => {
            switch (decision.decision) {
              case "declined":
                return {
                  borderColor: "border-red-200 dark:border-red-900",
                  badgeColor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
                  badgeText: "Declined",
                  icon: <Frown className="h-5 w-5 text-red-500" />,
                }
              case "maybe":
                return {
                  borderColor: "border-blue-200 dark:border-blue-900",
                  badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
                  badgeText: "Maybe",
                  icon: <Meh className="h-5 w-5 text-blue-500" />,
                }
              case "maybe-declined":
                return {
                  borderColor: "border-purple-200 dark:border-purple-900",
                  badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
                  badgeText: "Maybe → Declined",
                  icon: <Meh className="h-5 w-5 text-purple-500" />,
                }
              default:
                return {
                  borderColor: "border-gray-200 dark:border-gray-800",
                  badgeColor: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
                  badgeText: "Unknown",
                  icon: <Meh className="h-5 w-5 text-gray-500" />,
                }
            }
          }

          const styles = getDecisionStyles()

          return (
            <Card
              key={decision.timestamp}
              className={cn("history-item overflow-hidden border-2 bg-white dark:bg-gray-900", styles.borderColor)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{decision.event.title}</CardTitle>
                  <Badge className={styles.badgeColor}>
                    <span className="flex items-center gap-1">
                      {styles.icon}
                      {styles.badgeText}
                    </span>
                  </Badge>
                </div>
                <CardDescription className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{formattedTime}</span>
                  </div>
                  {decision.event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{decision.event.location}</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <h4 className="text-sm font-medium mb-1">Your Excuse:</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{decision.reason}"</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
