"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { useEvents } from '@/context/events-context'

export function CalendarAuth() {
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const { resetEvents } = useEvents()

  // Fetch auth URL only once on component mount
  useEffect(() => {
    const fetchAuthUrl = async () => {
      try {
        const response = await fetch('/api/calendar')
        const data = await response.json()
        if (data.authUrl) {
          setAuthUrl(data.authUrl)
        } else {
          throw new Error('No auth URL received')
        }
      } catch (error) {
        console.error('Error fetching auth URL:', error)
        toast({
          title: "Error",
          description: "Failed to initialize calendar connection. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchAuthUrl()
  }, []) // Empty dependency array means this runs only once on mount

  // Handle connection status changes
  useEffect(() => {
    const calendarStatus = searchParams.get('calendar')
    if (calendarStatus === 'connected') {
      toast({
        title: "Calendar Connected",
        description: "Your Google Calendar has been successfully connected.",
      })
      // Reload events after successful connection
      resetEvents()
    } else if (calendarStatus === 'error') {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Calendar. Please try again.",
        variant: "destructive",
      })
    }
  }, [searchParams, resetEvents])

  const handleConnect = async () => {
    if (!authUrl) {
      toast({
        title: "Error",
        description: "Authentication URL not ready. Please try again.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Open Google OAuth in a new window
      const width = 600
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2
      
      window.open(
        authUrl,
        'Google Calendar Auth',
        `width=${width},height=${height},left=${left},top=${top}`
      )
    } catch (error) {
      console.error('Error opening auth window:', error)
      toast({
        title: "Error",
        description: "Failed to open authentication window. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <Button disabled>Connecting to Calendar...</Button>
  }

  if (!authUrl) {
    return <Button disabled>Loading...</Button>
  }

  return (
    <Button
      onClick={handleConnect}
      className="w-full"
    >
      Connect Google Calendar
    </Button>
  )
} 