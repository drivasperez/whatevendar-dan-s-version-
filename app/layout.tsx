import type React from "react"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
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
    <html lang="en">
      <body className={outfit.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <EventsProvider>
            <div className="relative h-screen overflow-hidden">
              <Navbar />
              <div className="pt-16 h-full">{children}</div>
              <Toaster />
            </div>
          </EventsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
