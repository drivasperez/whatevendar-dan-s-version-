"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { useEvents } from "@/context/events-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { RefreshCw, Trash2 } from "lucide-react"

export function TestControls() {
  const { resetEvents, clearDecisions } = useEvents()
  const [showControls, setShowControls] = useState(false)

  const handleReset = () => {
    resetEvents()
  }

  const handleClearHistory = () => {
    clearDecisions()
  }

  const handleResetAll = () => {
    clearDecisions()
    resetEvents()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {showControls ? (
        <Card className="w-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Testing Controls</CardTitle>
            <CardDescription className="text-xs">Tools to help test the app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleReset}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset Events
            </Button>
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleClearHistory}>
              <Trash2 className="h-3 w-3 mr-1" />
              Clear History
            </Button>
            <Button size="sm" variant="default" className="w-full text-xs" onClick={handleResetAll}>
              Reset Everything
            </Button>
            <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => setShowControls(false)}>
              Hide Controls
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowControls(true)}>
          Show Test Controls
        </Button>
      )}
    </div>
  )
}
