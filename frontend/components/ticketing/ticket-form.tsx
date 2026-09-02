"use client"

import * as React from "react"
import { ClipboardList, Loader2, Send } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ApiError, submitTicket } from "@/lib/api"
import { priorityBadgeClass, verdictBadgeClass } from "@/lib/badge-utils"
import type { TriageResult } from "@/lib/triage-types"
import { cn } from "@/lib/utils"

export function TicketForm() {
  const [ticketText, setTicketText] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [result, setResult] = React.useState<TriageResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const canSubmit = ticketText.trim().length > 0 && !isSubmitting

  async function handleSubmit() {
    if (!canSubmit) return

    setIsSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const ticket = await submitTicket(ticketText.trim())
      setResult(ticket)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const wasRevised = result !== null && result.auditor.verdict === "rejected"

  return (
    <div className="flex h-full flex-col overflow-y-auto md:flex-row md:overflow-hidden">
      {/* Section 1: ticket intake */}
      <div className="shrink-0 border-b border-border/70 p-6 md:w-[26rem] md:overflow-y-auto md:border-r md:border-b-0">
        <h1 className="text-2xl font-bold tracking-tight">Report a maintenance issue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe what&apos;s wrong. Your ticket is triaged automatically, then independently checked against
          Marula&apos;s policy documents before you get a response.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Textarea
            value={ticketText}
            onChange={(event) => setTicketText(event.target.value)}
            placeholder="e.g. There's no hot water in my unit since this morning..."
            rows={6}
            disabled={isSubmitting}
            aria-label="Describe your maintenance issue"
          />
          <Button onClick={handleSubmit} disabled={!canSubmit} className="self-end">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Triaging...
              </>
            ) : (
              <>
                <Send className="size-4" /> Submit ticket
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Section 2: live audit trail */}
      <div className="flex-1 p-6 md:overflow-y-auto">
        {!result && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <ClipboardList className="size-8" strokeWidth={1.5} aria-hidden="true" />
            <p className="max-w-xs text-sm">
              The Triage Agent&apos;s draft, the Policy Auditor&apos;s verdict, and the final result will appear
              here once you submit a ticket.
            </p>
          </div>
        )}

        {result && (
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            <StageCard title="1. Triage Agent — first pass">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{result.triage.category}</Badge>
                <Badge className={priorityBadgeClass(result.triage.priority)}>{result.triage.priority}</Badge>
                <span className="text-xs text-muted-foreground">{result.triage.sla_target}</span>
              </div>
              <p className="text-sm leading-relaxed">{result.triage.draft_reply}</p>
            </StageCard>

            <StageCard title="2. Policy Auditor — independent check">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={verdictBadgeClass(result.auditor.verdict)}>
                  {result.auditor.verdict === "approved" ? "Approved" : "Rejected"}
                </Badge>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {result.auditor.citation}
                </span>
              </div>
              {result.auditor.verdict === "rejected" && (
                <p className="text-sm leading-relaxed text-foreground">{result.auditor.critique}</p>
              )}
            </StageCard>

            <StageCard title={wasRevised ? "3. Final result — corrected" : "3. Final result"}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{result.final.category}</Badge>
                <Badge className={priorityBadgeClass(result.final.priority)}>{result.final.priority}</Badge>
                <span className="text-xs text-muted-foreground">{result.final.sla_target}</span>
              </div>
              <p className="text-sm leading-relaxed">{result.final.draft_reply}</p>
              {result.citations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {result.citations.map((citation) => (
                    <span
                      key={citation}
                      className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {citation}
                    </span>
                  ))}
                </div>
              )}
            </StageCard>
          </div>
        )}
      </div>
    </div>
  )
}

function StageCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-xl border border-border bg-card p-4")}>
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
      {children}
    </div>
  )
}
