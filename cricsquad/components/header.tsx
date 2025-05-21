"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        isScrolled ? "bg-background/95 backdrop-blur-sm border-b shadow-sm" : "bg-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                CricSquad
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("hero")}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("overview")}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection("player-stats")}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Player Stats
            </button>
            <button
              onClick={() => scrollToSection("ipl-squads")}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              IPL Squads
            </button>
            <button
              onClick={() => scrollToSection("squad-selection")}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Squad Selection
            </button>
            <button
              onClick={() => scrollToSection("match-prediction")}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Match Prediction
            </button>
            <ModeToggle />
          </nav>

          <div className="flex md:hidden items-center">
            <ModeToggle />
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="ml-2">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b">
          <div className="px-4 py-2 space-y-1">
            <button
              onClick={() => scrollToSection("hero")}
              className="block w-full text-left px-3 py-2 rounded-md hover:bg-muted"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("overview")}
              className="block w-full text-left px-3 py-2 rounded-md hover:bg-muted"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection("player-stats")}
              className="block w-full text-left px-3 py-2 rounded-md hover:bg-muted"
            >
              Player Stats
            </button>
            <button
              onClick={() => scrollToSection("ipl-squads")}
              className="block w-full text-left px-3 py-2 rounded-md hover:bg-muted"
            >
              IPL Squads
            </button>
            <button
              onClick={() => scrollToSection("squad-selection")}
              className="block w-full text-left px-3 py-2 rounded-md hover:bg-muted"
            >
              Squad Selection
            </button>
            <button
              onClick={() => scrollToSection("match-prediction")}
              className="block w-full text-left px-3 py-2 rounded-md hover:bg-muted"
            >
              Match Prediction
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

