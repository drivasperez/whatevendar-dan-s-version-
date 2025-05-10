import type React from "react"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"
import { EventsProvider } from "@/context/events-context"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

export const metadata: Metadata = {
  title: "SwipeTime",
  description: "A silly productivity app for managing your calendar events",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <EventsProvider>
          <div className="relative h-screen overflow-hidden">
            <Navbar />
            <div className="pt-16 h-full">{children}</div>
            <Toaster />
          </div>
        </EventsProvider>
      </body>
    </html>
  )
}
