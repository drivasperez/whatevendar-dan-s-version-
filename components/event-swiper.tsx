"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { EventCard } from "./event-card"
import { ResultCard } from "./result-card"
import { LoadingResultCard } from "./loading-result-card"
import { ConfettiEffect } from "./confetti-effect"
import { ExcuseBubbles } from "./excuse-bubbles"
import { useEvents } from "@/context/events-context"
import type { CalendarEvent } from "@/types/events"
import { generateLocalExcuse, generateAIExcuse } from "@/lib/excuse-generator"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { RefreshCw } from "lucide-react"

// Define a type for the cards in the deck
type CardInDeck =
  | { type: "event"; event: CalendarEvent }
  | { type: "loading"; decision: "declined" | "maybe" | "maybe-declined" }
  | { type: "result"; decision: "declined" | "maybe" | "maybe-declined"; comment?: string; excuse: string }

export default function EventSwiper() {
  const { events, addDecision, resetEvents, isLoading, error } = useEvents()
  const [showDialog, setShowDialog] = useState(false)
  const [dialogAttempt, setDialogAttempt] = useState(0)
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null)
  const [noMoreEvents, setNoMoreEvents] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showBubbles, setShowBubbles] = useState(false)
  const [shouldBounceNextCard, setShouldBounceNextCard] = useState(false)

  // Track all cards in the deck (events, loading, and results)
  const [cardsInDeck, setCardsInDeck] = useState<CardInDeck[]>([])

  // Ref to track if this is the first render
  const isFirstRender = useRef(true)

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

    // After initial render, set isFirstRender to false
    if (isFirstRender.current) {
      isFirstRender.current = false
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

  // Show bubbles when there's an active event card
  useEffect(() => {
    // Check if the top card is an event card
    const hasActiveEventCard = cardsInDeck.length > 0 && cardsInDeck[0].type === "event"
    setShowBubbles(hasActiveEventCard)
  }, [cardsInDeck])

  // Handle event card swipe
  const handleEventSwipe = useCallback(
    async (direction: "left" | "right" | "up", event: CalendarEvent) => {
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

        // Update the loading card
        const newDeck = [...cardsInDeck]
        if (newDeck[loadingIndex].type === "loading") {
          newDeck[loadingIndex] = { 
            type: "loading",
            decision
          }
        }
        
        // Remove the event card to reveal the loading card
        newDeck.splice(eventIndex, 1)
        setCardsInDeck(newDeck)

        try {
          // Generate an AI excuse
          const excuse = await generateAIExcuse(event.title, event.type)
          
          // Add to decision history with just the AI excuse
          addDecision({
            eventId: event.id,
            event: event,
            decision: "declined",
            excuse,
            timestamp: new Date().toISOString(),
          })

          // Replace the loading card with a result card
          setCardsInDeck((prev) => {
            const updatedDeck = [...prev]
            const loadingCardIndex = updatedDeck.findIndex((card) => card.type === "loading")
            if (loadingCardIndex !== -1) {
              updatedDeck[loadingCardIndex] = {
                type: "result",
                decision,
                excuse,
              }
            }
            return updatedDeck
          })
        } catch (error) {
          console.error("Error generating AI excuse:", error)
          
          // Fallback to local excuse generation
          const excuse = generateLocalExcuse()
          
          addDecision({
            eventId: event.id,
            event: event,
            decision: "declined",
            excuse,
            timestamp: new Date().toISOString(),
          })
          
          setCardsInDeck((prev) => {
            const updatedDeck = [...prev]
            const loadingCardIndex = updatedDeck.findIndex((card) => card.type === "loading")
            if (loadingCardIndex !== -1) {
              updatedDeck[loadingCardIndex] = {
                type: "result",
                decision,
                excuse,
              }
            }
            return updatedDeck
          })
        }
      } else if (direction === "up") {
        decision = "maybe-declined"

        // Update the loading card
        const newDeck = [...cardsInDeck]
        if (newDeck[loadingIndex].type === "loading") {
          newDeck[loadingIndex] = { 
            type: "loading",
            decision
          }
        }
        
        // Remove the event card to reveal the loading card
        newDeck.splice(eventIndex, 1)
        setCardsInDeck(newDeck)

        try {
          // Generate an AI excuse
          const excuse = await generateAIExcuse(event.title, event.type)
          
          // Add to decision history with just the AI excuse
          addDecision({
            eventId: event.id,
            event: event,
            decision: "maybe-declined",
            excuse, // Store just the AI excuse without the snarky prefix
            timestamp: new Date().toISOString(),
          })
          
          // Replace the loading card with a result card
          setCardsInDeck((prev) => {
            const updatedDeck = [...prev]
            const loadingCardIndex = updatedDeck.findIndex((card) => card.type === "loading")
            if (loadingCardIndex !== -1) {
              updatedDeck[loadingCardIndex] = {
                type: "result",
                decision,
                comment: "You selected Maybe, but let's be honest, you probably wanted to decline it anyway.",
                excuse,
              }
            }
            return updatedDeck
          })
        } catch (error) {
          console.error("Error generating AI excuse:", error)
          
          // Fallback to local excuse generation
          const excuse = generateLocalExcuse()
          
          addDecision({
            eventId: event.id,
            event: event,
            decision: "maybe-declined",
            excuse, // Store just the excuse without the snarky prefix
            timestamp: new Date().toISOString(),
          })
          
          setCardsInDeck((prev) => {
            const updatedDeck = [...prev]
            const loadingCardIndex = updatedDeck.findIndex((card) => card.type === "loading")
            if (loadingCardIndex !== -1) {
              updatedDeck[loadingCardIndex] = {
                type: "result",
                decision,
                comment: "You selected Maybe, but let's be honest, you probably wanted to decline it anyway.",
                excuse,
              }
            }
            return updatedDeck
          })
        }
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
    // Set the bounce flag for the next card
    setShouldBounceNextCard(true)

    setCardsInDeck((prev) => {
      const newDeck = [...prev]
      // Remove the first card (the result card)
      newDeck.shift()
      return newDeck
    })
  }, [])

  // Handle loading card dismissal (if user swipes it away before it changes to result)
  const handleLoadingDismiss = useCallback(() => {
    // Set the bounce flag for the next card
    setShouldBounceNextCard(true)

    setCardsInDeck((prev) => {
      const newDeck = [...prev]
      // Remove the first card (the loading card)
      newDeck.shift()
      return newDeck
    })
  }, [])

  const handleDialogContinue = async () => {
    if (dialogAttempt < 4) {
      // Increment attempt counter
      setDialogAttempt((prev) => prev + 1)
    } else {
      // On 5th attempt, mark as maybe and close dialog
      if (currentEvent) {
        const decision = "maybe"

        // Find the event card and the loading card that follows it
        const eventIndex = cardsInDeck.findIndex((card) => card.type === "event" && card.event.id === currentEvent.id)

        if (eventIndex !== -1) {
          const loadingIndex = eventIndex + 1

          // Make sure the loading card exists
          if (loadingIndex < cardsInDeck.length && cardsInDeck[loadingIndex].type === "loading") {
            // Update the loading card
            const newDeck = [...cardsInDeck]
            if (newDeck[loadingIndex].type === "loading") {
              newDeck[loadingIndex] = { 
                type: "loading",
                decision
              }
            }

            // Remove the event card to reveal the loading card
            newDeck.splice(eventIndex, 1)
            setCardsInDeck(newDeck)
            
            const comment = "After much convincing, you tentatively agreed to attend."
            
            // Add to decision history
            addDecision({
              eventId: currentEvent.id,
              event: currentEvent,
              decision,
              comment,
              excuse: undefined,
              timestamp: new Date().toISOString(),
            })

            // After a brief delay, replace the loading card with a result card
            setTimeout(async () => {
              const excuse = await generateAIExcuse(currentEvent.title, currentEvent.type)
              
              setCardsInDeck((prev) => {
                const updatedDeck = [...prev]
                const loadingCardIndex = updatedDeck.findIndex((card) => card.type === "loading")
                if (loadingCardIndex !== -1) {
                  updatedDeck[loadingCardIndex] = {
                    type: "result",
                    decision,
                    comment: "You made the right choice!",
                    excuse
                  }
                }
                return updatedDeck
              })
            }, 1000) // Brief delay to show loading
          }
        }
      }

      setShowDialog(false)
      setCurrentEvent(null)
      setDialogAttempt(0)
    }
  }

  const handleDialogCancel = async () => {
    // User gives up trying to accept
    if (currentEvent) {
      const decision = "declined"

      // Find the event card and the loading card that follows it
      const eventIndex = cardsInDeck.findIndex((card) => card.type === "event" && card.event.id === currentEvent.id)

      if (eventIndex !== -1) {
        const loadingIndex = eventIndex + 1

        // Make sure the loading card exists
        if (loadingIndex < cardsInDeck.length && cardsInDeck[loadingIndex].type === "loading") {
          // Update the loading card
          const newDeck = [...cardsInDeck]
          if (newDeck[loadingIndex].type === "loading") {
            newDeck[loadingIndex] = { 
              type: "loading",
              decision
            }
          }

          // Remove the event card to reveal the loading card
          newDeck.splice(eventIndex, 1)
          setCardsInDeck(newDeck)
          
          try {
            // Generate an AI excuse
            const excuse = await generateAIExcuse(currentEvent.title, currentEvent.type)
            
            // Add to decision history with just the AI excuse
            addDecision({
              eventId: currentEvent.id,
              event: currentEvent,
              decision,
              excuse,
              timestamp: new Date().toISOString(),
            })

            // Replace the loading card with a result card
            setCardsInDeck((prev) => {
              const updatedDeck = [...prev]
              const loadingCardIndex = updatedDeck.findIndex((card) => card.type === "loading")
              if (loadingCardIndex !== -1) {
                updatedDeck[loadingCardIndex] = {
                  type: "result",
                  decision,
                  comment: "You made the right choice!",
                  excuse,
                }
              }
              return updatedDeck
            })
          } catch (error) {
            console.error("Error generating AI excuse:", error)
            
            // Fallback to local excuse generation
            const excuse = generateLocalExcuse()
            
            addDecision({
              eventId: currentEvent.id,
              event: currentEvent,
              decision,
              excuse,
              timestamp: new Date().toISOString(),
            })
            
            setCardsInDeck((prev) => {
              const updatedDeck = [...prev]
              const loadingCardIndex = updatedDeck.findIndex((card) => card.type === "loading")
              if (loadingCardIndex !== -1) {
                updatedDeck[loadingCardIndex] = {
                  type: "result",
                  decision,
                  comment: "You made the right choice!",
                  excuse,
                }
              }
              return updatedDeck
            })
          }
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

  // Reset the bounce flag after a short delay
  useEffect(() => {
    if (shouldBounceNextCard) {
      const timer = setTimeout(() => {
        setShouldBounceNextCard(false)
      }, 0) // Reduced from 500ms to 100ms for faster reset
      return () => clearTimeout(timer)
    }
  }, [shouldBounceNextCard])

  if (isLoading) {
    return (
      <div className="w-full h-[500px] flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <div className="text-6xl mb-4">⏳</div>
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Loading Events...</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
          Please wait while we fetch your calendar events.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[500px] flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Error Loading Events</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center mt-2 mb-6">
          {error}
        </p>
        <Button onClick={resetEvents} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
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
      {/* Bubbles are now rendered at the root level, outside any card transforms */}
      <ExcuseBubbles active={showBubbles} />

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
                shouldBounce={isActive && shouldBounceNextCard && !isFirstRender.current}
                xThreshold={100} // Add configurable threshold
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
                xThreshold={50} // Add configurable threshold
              />
            )
          } else {
            return (
              <ResultCard
                key={`result-${index}`}
                decision={card.decision}
                comment={card.comment}
                excuse={card.excuse}
                onDismiss={handleResultDismiss}
                active={isActive}
                index={index}
                xThreshold={50} // Add configurable threshold
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
