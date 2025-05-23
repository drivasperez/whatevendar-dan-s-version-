import type React from "react"
import type { Metadata } from "next"
import { Old_Standard_TT, Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"
import { EventsProvider } from "@/context/events-context"
import { LavaLampBackground } from "@/components/lava-lamp-background"
import { ThemeProvider } from "@/components/theme-provider"

// Load Old Standard TT font
const oldStandard = Old_Standard_TT({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-old-standard",
  display: "swap",
})

// Load Inter font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Whatevendar",
  description: "A silly productivity app for managing your calendar events",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${oldStandard.variable} ${inter.variable}`}>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <EventsProvider>
            <div className="relative h-screen overflow-hidden">
              <LavaLampBackground />
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
