/**
 * Small pieces shared by the module forms so a visitor has something useful to
 * do while the demo backend wakes up: sample inputs to try, and a short
 * explanation of the pipeline their request is about to go through.
 */

import { ACCENT_BG, type ModuleAccent } from "@/lib/module-theme"
import { cn } from "@/lib/utils"

export function SamplePicker({
  samples,
  onPick,
  disabled = false,
}: {
  samples: { label: string; value: string }[]
  onPick: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-muted-foreground">
        Try a sample
      </span>
      <div className="flex flex-wrap gap-1.5">
        {samples.map((sample) => (
          <button
            key={sample.label}
            type="button"
            onClick={() => onPick(sample.value)}
            disabled={disabled}
            className="rounded-full bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * A static explainer, not live progress - the backend returns one response at the
 * end, so animating these steps would imply status it doesn't actually report.
 * Rendered as the module's flat colour block so the empty results panel has a
 * deliberate focal point instead of a lone icon.
 */
export function HowItWorks({
  steps,
  accent,
}: {
  steps: string[]
  accent: ModuleAccent
}) {
  return (
    <div
      className={cn(
        "relative w-full max-w-lg overflow-hidden rounded-3xl p-6 text-left text-on-accent sm:p-8",
        ACCENT_BG[accent]
      )}
    >
      <div
        className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-on-accent/10"
        aria-hidden="true"
      />
      <h2 className="relative text-sm font-bold tracking-wide uppercase">
        How it works
      </h2>
      <ol className="relative mt-5 flex flex-col gap-4">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-4">
            <span className="w-8 shrink-0 text-2xl leading-none font-extrabold tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-sm leading-relaxed font-medium">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
