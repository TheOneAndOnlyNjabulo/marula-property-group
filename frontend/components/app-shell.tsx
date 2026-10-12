"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageCircleQuestion, Trees, Wrench } from "lucide-react"

import { BottomNav } from "@/components/bottom-nav"
import { ServerStatusBanner } from "@/components/server-status"
import { ThemeToggle } from "@/components/theme-toggle"
import { useBackendStatus } from "@/hooks/use-backend-status"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Submit a Ticket", shortLabel: "Ticket", icon: Wrench },
  { href: "/chat", label: "Ask a Question", shortLabel: "Chat", icon: MessageCircleQuestion },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Mounted once here, not per page, so the backend starts waking on whichever
  // page a visitor lands on.
  const backendStatus = useBackendStatus()
  const showStatus = backendStatus === "waking" || backendStatus === "unreachable"

  return (
    <div className="flex h-svh flex-col bg-background">
      {/* Flat header: no borders or shadow - whitespace and the pill nav do the separating */}
      <header className="shrink-0 pt-3 md:pt-4">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Trees className="size-4.5" strokeWidth={2} aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight">Marula</div>
              <div className="text-[11px] font-medium text-muted-foreground">Property Group</div>
            </div>
          </Link>

          <nav className="hidden gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground lg:inline">
              Maintenance helpdesk
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content - a bounded viewport; each page owns its own scroll region
          within it, and caps its own content at max-w-7xl (matching the header) so
          wide screens get side margins while scrollbars stay at the window edge. */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {showStatus && (
          <div className="mx-auto w-full max-w-7xl shrink-0 px-4 pt-4 sm:px-6">
            <ServerStatusBanner status={backendStatus} />
          </div>
        )}
        {children}
      </main>

      <BottomNav items={NAV_ITEMS} />
    </div>
  )
}
