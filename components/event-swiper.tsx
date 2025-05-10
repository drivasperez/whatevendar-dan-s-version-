"use client"

import { useState, useEffect, useCallback } from "react"
import { EventCard } from "./event-card"
import { ResultCard } from "./result-card"
import { LoadingResultCard } from "./loading-result-card"
import { ConfettiEffect } from "./confetti-effect"
import { useEvents } from "@/context/events-context"
import type { CalendarEvent } from "@/types/events"
import { generateExcuse } from "@/lib/excuse-generator"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { RefreshCw } from "lucide-react"

// Define a type for the cards in the deck
type CardInDeck =
  | { type: "event"; event: CalendarEvent }
  | { type: "loading"; decision: "declined" | "maybe" | "maybe-declined" }
  | { type: "result"; decision: "declined" | "maybe" | "maybe-declined"; reason: string }

export default function EventSwiper() {
  const { events, addDecision, resetEvents } = useEvents()
  const [showDialog, setShowDialog] = useState(false)
  const [dialogAttempt, setDialogAttempt] = useState(0)
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null)
  const [noMoreEvents, setNoMoreEvents] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Track all cards in the deck (events, loading, and results)
  const [cardsInDeck, setCardsInDeck] = useState<CardInDeck[]>([])

  // Initialize the deck with event cards and loading cards
  useEffect(() => {
    if (events.length === 0) {
      setNoMoreEvents(true)
      setCardsInDeck([])
    } else {
      setNoMoreEvents(false)
      // Only initialize if the deck is empty to avoid resetting during interactions
      if (cardsInDeck.length === 0) {
        // For each event, create an event card followed by a loading card
        const newDeck: CardInDeck[] = []
        events.forEach((event) => {
          newDeck.push({ type: "event", event })
          // Add a loading card after each event card
          newDeck.push({ type: "loading", decision: "declined" })
        })
        setCardsInDeck(newDeck)
      }
    }
  }, [events, cardsInDeck.length])

  // Check if we've run out of events
  useEffect(() => {
    // If there are no event cards left in the deck
    const hasEventCards = cardsInDeck.some((card) => card.type === "event")
    if (!hasEventCards && cardsInDeck.length === 0) {
      setNoMoreEvents(true)
      // Trigger confetti when we reach the end of the deck
      setShowConfetti(true)

      // Reset confetti after a few seconds
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [cardsInDeck])

  // Handle event card swipe
  const handleEventSwipe = useCallback(
    (direction: "left" | "right" | "up", event: CalendarEvent) => {
      // Find the event card and the loading card that follows it
      const eventIndex = cardsInDeck.findIndex((card) => card.type === "event" && card.event.id === event.id)

      // Only process if this is the top card
      if (eventIndex !== 0) return

      // The loading card should be right after the event card
      const loadingIndex = eventIndex + 1

      // Make sure the loading card exists
      if (loadingIndex >= cardsInDeck.length || cardsInDeck[loadingIndex].type !== "loading") {
        console.error("Loading card not found after event card")
        return
      }

      // Update the loading card's decision based on swipe direction
      let decision: "declined" | "maybe" | "maybe-declined" = "declined"

      if (direction === "left") {
        decision = "declined"

        // Add to decision history
        const excuse = generateExcuse()
        addDecision({
          eventId: event.id,
          event: event,
          decision: "declined",
          reason: excuse,
          timestamp: new Date().toISOString(),
        })

        // Update the loading card with the correct decision
        const newDeck = [...cardsInDeck]
        newDeck[loadingIndex] = { ...newDeck[loadingIndex], decision }

        // Remove the event card to reveal the loading card
        newDeck.splice(eventIndex, 1)

        // After a delay, replace the loading card with a result card
        setTimeout(() => {
          setCardsInDeck((prev) => {
            const updatedDeck = [...prev]
            const loadingCardIndex = updatedDeck.findIndex((card) => card.type === "loading")
            if (loadingCardIndex !== -1) {
              updatedDeck[loadingCardIndex] = {
                type: "result",
                decision,
                reason: excuse,
              }
            }
            return updatedDeck
          })
        }, 1500) // 1.5 second delay to show loading

        setCardsInDeck(newDeck)
      } else if (direction === "up") {
        decision = "maybe-declined"

        // Add to decision history
        const excuse = generateExcuse()
        const reason = "You selected Maybe, but let's be honest, you probably wanted to decline it anyway. " + excuse

        addDecision({
          eventId: event.id,
          event: event,
          decision: "maybe-declined",
          reason,
          timestamp: new Date().toISOString(),
        })

        // Update the loading card with the correct decision
        const newDeck = [...cardsInDeck]
        newDeck[loadingIndex] = { ...newDeck[loadingIndex], decision }

        // Remove the event card to reveal the loading card
        newDeck.splice(eventIndex, 1)

        // After a delay, replace the loading card with a result card
        setTimeout(() => {
          setCardsInDeck((prev) => {
            const updatedDeck = [...prev]
            const loadingCardIndex = updatedDeck.findIndex((card) => card.type === "loading")
            if (loadingCardIndex !== -1) {
              updatedDeck[loadingCardIndex] = {
                type: "result",
                decision,
                reason,
              }
            }
            return updatedDeck
          })
        }, 1500) // 1.5 second delay to show loading

        setCardsInDeck(newDeck)
      } else if (direction === "right") {
        // For right swipe, show dialog
        setCurrentEvent(event)
        setDialogAttempt(1)
        setShowDialog(true)
      }
    },
    [cardsInDeck, addDecision],
  )

  // Handle result card dismissal
  const handleResultDismiss = useCallback(() => {
    setCardsInDeck((prev) => {
      const newDeck = [...prev]
      // Remove the first card (the result card)
      newDeck.shift()
      return newDeck
    })
  }, [])

  // Handle loading card dismissal (if user swipes it away before it changes to result)
  const handleLoadingDismiss = useCallback(() => {
    setCardsInDeck((prev) => {
      const newDeck = [...prev]
      // Remove the first card (the loading card)
      newDeck.shift()
      return newDeck
    })
  }, [])

  const handleDialogContinue = () => {
    if (dialogAttempt < 4) {
      // Increment attempt counter
      setDialogAttempt((prev) => prev + 1)
    } else {
      // On 5th attempt, mark as maybe and close dialog
      if (currentEvent) {
        const reason = "After much convincing, you tentatively agreed to attend."
        const decision = "maybe"

        addDecision({
          eventId: currentEvent.id,
          event: currentEvent,
          decision,
          reason,
          timestamp: new Date().toISOString(),
        })

        // Find the event card and the loading card that follows it
        const eventIndex = cardsInDeck.findIndex((card) => card.type === "event" && card.event.id === currentEvent.id)

        if (eventIndex !== -1) {
          const loadingIndex = eventIndex + 1

          // Make sure the loading card exists
          if (loadingIndex < cardsInDeck.length && cardsInDeck[loadingIndex].type === "loading") {
            // Update the loading card with the correct decision
            const newDeck = [...cardsInDeck]
            newDeck[loadingIndex] = { ...newDeck[loadingIndex], decision }

            // Remove the event card to reveal the loading card
            newDeck.splice(eventIndex, 1)

            // After a delay, replace the loading card with a result card
            setTimeout(() => {
              setCardsInDeck((prev) => {
                const updatedDeck = [...prev]
                const loadingCardIndex = updatedDeck.findIndex((card) => card.type === "loading")
                if (loadingCardIndex !== -1) {
                  updatedDeck[loadingCardIndex] = {
                    type: "result",
                    decision,
                    reason,
                  }
                }
                return updatedDeck
              })
            }, 1500) // 1.5 second delay to show loading

            setCardsInDeck(newDeck)
          }
        }
      }

      setShowDialog(false)
      setCurrentEvent(null)
      setDialogAttempt(0)
    }
  }

  const handleDialogCancel = () => {
    // User gives up trying to accept
    if (currentEvent) {
      const excuse = generateExcuse()
      const reason = "You made the right choice! " + excuse
      const decision = "declined"

      addDecision({
        eventId: currentEvent.id,
        event: currentEvent,
        decision,
        reason,
        timestamp: new Date().toISOString(),
      })

      // Find the event card and the loading card that follows it
      const eventIndex = cardsInDeck.findIndex((card) => card.type === "event" && card.event.id === currentEvent.id)

      if (eventIndex !== -1) {
        const loadingIndex = eventIndex + 1

        // Make sure the loading card exists
        if (loadingIndex < cardsInDeck.length && cardsInDeck[loadingIndex].type === "loading") {
          // Update the loading card with the correct decision
          const newDeck = [...cardsInDeck]
          newDeck[loadingIndex] = { ...newDeck[loadingIndex], decision }

          // Remove the event card to reveal the loading card
          newDeck.splice(eventIndex, 1)

          // After a delay, replace the loading card with a result card
          setTimeout(() => {
            setCardsInDeck((prev) => {
              const updatedDeck = [...prev]
              const loadingCardIndex = updatedDeck.findIndex((card) => card.type === "loading")
              if (loadingCardIndex !== -1) {
                updatedDeck[loadingCardIndex] = {
                  type: "result",
                  decision,
                  reason,
                }
              }
              return updatedDeck
            })
          }, 1500) // 1.5 second delay to show loading

          setCardsInDeck(newDeck)
        }
      }
    }

    setShowDialog(false)
    setCurrentEvent(null)
    setDialogAttempt(0)
  }

  const getDialogContent = () => {
    switch (dialogAttempt) {
      case 1:
        return {
          title: "Are you sure?",
          description: "Do you really want to attend this event? You could be doing something more fun instead.",
        }
      case 2:
        return {
          title: "Really, really sure?",
          description: "Think of all the Netflix shows you could be watching instead of going to this event.",
        }
      case 3:
        return {
          title: "Last chance to back out!",
          description: "Your couch is going to miss you. Your snacks will feel abandoned.",
        }
      case 4:
        return {
          title: "Fine, have it your way...",
          description: "We'll mark you as 'maybe' attending, but don't say we didn't warn you!",
        }
      default:
        return {
          title: "Decision Time",
          description: "What do you want to do with this event?",
        }
    }
  }

  // Handle reset for testing
  const handleReset = () => {
    resetEvents()
    setCardsInDeck([])
    setNoMoreEvents(false)
    setShowConfetti(false)
  }

  if (noMoreEvents) {
    return (
      <>
        <ConfettiEffect active={showConfetti} />
        <div className="w-full h-[500px] flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">All Events Processed!</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center mt-2 mb-6">
            You've successfully avoided all your responsibilities. Congratulations!
          </p>
          <Button onClick={handleReset} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset Events for Testing
          </Button>
        </div>
      </>
    )
  }

  const dialogContent = getDialogContent()

  return (
    <>
      <div className="relative w-full h-[500px] flex items-center justify-center">
        {cardsInDeck.slice(0, 3).map((card, index) => {
          // Apply consistent card styling and positioning
          const isActive = index === 0

          if (card.type === "event") {
            return (
              <EventCard
                key={`event-${card.event.id}`}
                event={card.event}
                onSwipe={handleEventSwipe}
                active={isActive}
                index={index}
              />
            )
          } else if (card.type === "loading") {
            return (
              <LoadingResultCard
                key={`loading-${index}`}
                decision={card.decision}
                onDismiss={handleLoadingDismiss}
                active={isActive}
                index={index}
              />
            )
          } else {
            return (
              <ResultCard
                key={`result-${index}`}
                decision={card.decision}
                reason={card.reason}
                onDismiss={handleResultDismiss}
                active={isActive}
                index={index}
              />
            )
          }
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription>{dialogContent.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleDialogCancel}>
              You're right, decline it
            </Button>
            {dialogAttempt < 5 && <Button onClick={handleDialogContinue}>No, I really want to go!</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
