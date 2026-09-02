"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/", label: "Submit a Ticket" },
  { href: "/chat", label: "Ask a Question" },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border/70">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
            <span className="text-lg font-bold tracking-tight">Marula Property Group</span>
          </div>
          <p className="mt-0.5 pl-4 text-xs text-muted-foreground">Maintenance helpdesk</p>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground",
                  pathname === link.href && "bg-secondary text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
