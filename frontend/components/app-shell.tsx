"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageCircleQuestion, Trees, Wrench } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Submit a Ticket", shortLabel: "Ticket", icon: Wrench },
  { href: "/chat", label: "Ask a Question", shortLabel: "Chat", icon: MessageCircleQuestion },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-svh flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-5 py-6">
          <Trees className="size-6 text-primary" strokeWidth={1.75} aria-hidden="true" />
          <div>
            <div className="text-sm font-bold tracking-tight">Marula</div>
            <div className="text-[11px] text-muted-foreground">Property Group</div>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto flex items-center justify-between border-t border-sidebar-border px-5 py-4">
          <span className="text-[11px] text-muted-foreground">Maintenance helpdesk</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border/70 px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <Trees className="size-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
          <span className="text-sm font-bold tracking-tight">Marula Property Group</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main content - a bounded viewport; each page owns its own scroll region within it */}
      <main className="flex flex-1 flex-col overflow-hidden pb-16 md:pb-0">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border/70 bg-background/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
              {item.shortLabel}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
