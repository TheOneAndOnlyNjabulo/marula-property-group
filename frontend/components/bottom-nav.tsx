"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type BottomNavItem = {
  href: string
  shortLabel: string
  icon: LucideIcon
}

/**
 * Phone-only tab bar, rendered as the last row of the app's full-height flex
 * column rather than position:fixed - so it never overlaps page content and
 * needs no matching bottom padding anywhere else. The active tab gets a filled
 * pill behind its icon, like a native app's navigation bar.
 */
export function BottomNav({ items }: { items: BottomNavItem[] }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="shrink-0 border-t border-border bg-background px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden"
    >
      <div className="flex">
        {items.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 py-0.5 text-[11px] font-semibold"
            >
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                  active
                    ? "animate-pop bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
              </span>
              <span
                className={active ? "text-foreground" : "text-muted-foreground"}
              >
                {item.shortLabel}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
