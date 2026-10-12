"use client"

import * as React from "react"
import { Loader2, Send, Wrench } from "lucide-react"

import { HowItWorks, SamplePicker } from "@/components/module-helpers"
import { PageHeader } from "@/components/page-header"
import { SlowRequestHint } from "@/components/server-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ApiError, submitTicket } from "@/lib/api"
import { priorityBadgeClass, verdictBadgeClass } from "@/lib/badge-utils"
import type { TriageResult } from "@/lib/triage-types"

// Drawn from the eval set (backend/eval/eval_set.py), one per priority tier, so
// each is known to exercise the triage + audit path. Picking one only fills the
// textarea - the visitor still submits it themselves.
const SAMPLE_TICKETS = [
  { label: "Burst pipe", value: "There is a burst pipe flooding my bathroom right now, water everywhere!" },
  {
    label: "No hot water",
    value: "There's no hot water in my unit since this morning. The geyser itself doesn't look like it's leaking.",
  },
  {
    label: "Sparking socket",
    value: "I can smell burning and see sparks coming from the wall socket in my lounge.",
  },
  {
    label: "Dripping tap",
    value: "My kitchen tap has been dripping constantly for the past two weeks, it's not urgent but it's annoying.",
  },
]

const HOW_IT_WORKS = [
  "The Triage Agent classifies the ticket (category, priority, SLA) and drafts a reply.",
  "The Policy Auditor retrieves the relevant policy sections and independently checks that classification.",
  "If the Auditor rejects it, the ticket is revised using the cited correction before the final result is returned.",
]

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
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden">
      <PageHeader
        accent="ticket"
        icon={Wrench}
        eyebrow="Triage + Policy Auditor"
        title="Report a maintenance issue"
        description="Describe what's wrong. Your ticket is triaged automatically, then independently checked against Marula's policy documents before you get a response."
      />

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6 md:flex-row md:overflow-hidden">
        {/* Section 1: ticket intake */}
        <div className="shrink-0 rounded-3xl bg-card p-5 md:w-[26rem] md:overflow-y-auto">
          <div className="flex flex-col gap-3">
            <SamplePicker samples={SAMPLE_TICKETS} onPick={setTicketText} disabled={isSubmitting} />
            <Textarea
              value={ticketText}
              onChange={(event) => setTicketText(event.target.value)}
              placeholder="e.g. There's no hot water in my unit since this morning..."
              rows={6}
              className="min-h-44"
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
            {isSubmitting && <SlowRequestHint />}
          </div>

          {error && (
            <div className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
          )}
        </div>

        {/* Section 2: live audit trail */}
        <div className="flex-1 rounded-3xl border border-border p-5 sm:p-6 md:overflow-y-auto">
          {!result && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <HowItWorks steps={HOW_IT_WORKS} accent="ticket" />
              <p className="max-w-xs text-sm">
                The Triage Agent&apos;s draft, the Policy Auditor&apos;s verdict, and the final result will appear
                here once you submit a ticket.
              </p>
            </div>
          )}

          {result && (
            <div className="mx-auto flex max-w-2xl flex-col gap-3">
              <StageCard index={1} title="Triage Agent — first pass">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{result.triage.category}</Badge>
                  <Badge className={priorityBadgeClass(result.triage.priority)}>{result.triage.priority}</Badge>
                  <span className="text-xs text-muted-foreground">{result.triage.sla_target}</span>
                </div>
                <p className="text-sm leading-relaxed">{result.triage.draft_reply}</p>
              </StageCard>

              <StageCard index={2} title="Policy Auditor — independent check">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={verdictBadgeClass(result.auditor.verdict)}>
                    {result.auditor.verdict === "approved" ? "Approved" : "Rejected"}
                  </Badge>
                  <span className="rounded-full bg-background px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {result.auditor.citation}
                  </span>
                </div>
                {result.auditor.verdict === "rejected" && (
                  <p className="text-sm leading-relaxed text-foreground">{result.auditor.critique}</p>
                )}
              </StageCard>

              <StageCard index={3} title={wasRevised ? "Final result — corrected" : "Final result"}>
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
                        className="rounded-full bg-background px-2.5 py-1 font-mono text-[10px] text-muted-foreground"
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
    </div>
  )
}

function StageCard({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-3xl bg-card p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {index}
        </span>
        <h2 className="text-sm font-bold tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  )
}
