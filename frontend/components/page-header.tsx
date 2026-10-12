import type { LucideIcon } from "lucide-react"

import { ACCENT_BG, type ModuleAccent } from "@/lib/module-theme"
import { cn } from "@/lib/utils"

export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  accent,
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  action?: React.ReactNode
  accent?: ModuleAccent
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-4 px-4 pt-6 pb-5 sm:px-6">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl",
            accent ? cn(ACCENT_BG[accent], "text-on-accent") : "bg-primary text-primary-foreground"
          )}
        >
          <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
        </div>
        <div>
          <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {eyebrow}
          </span>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
