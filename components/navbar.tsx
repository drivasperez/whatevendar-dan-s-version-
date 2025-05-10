"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, ClockIcon, History } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 z-50 w-full backdrop-blur-md bg-white/70 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <ClockIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-2 flex flex-col">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 font-inter">
                  Whatevendar
                </span>
                <span className="text-xs text-gray-500 -mt-1">don't go to that meeting</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className={cn(
                "inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2",
                pathname === "/"
                  ? "border-purple-500 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              <Calendar className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Swipe</span>
            </Link>
            <Link
              href="/history"
              className={cn(
                "inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2",
                pathname === "/history"
                  ? "border-purple-500 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              <History className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">History</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
