"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { ApiError, fetchTicketRun } from "@/lib/api"
import { priorityBadgeClass, verdictBadgeClass } from "@/lib/badge-utils"
import type { TicketRunDetail } from "@/lib/admin-types"

export default function AdminTicketDetailPage() {
  const params = useParams<{ id: string }>()
  const [run, setRun] = React.useState<TicketRunDetail | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchTicketRun(params.id)
      .then(setRun)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load ticket run."))
  }, [params.id])

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
        <Link
          href="/admin"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> All ticket runs
        </Link>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!run && !error && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading ticket run...
          </div>
        )}

        {run && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Original ticket
              </h2>
              <p className="mt-1 text-sm leading-relaxed">{run.ticket_text}</p>
              <p className="mt-2 text-xs text-muted-foreground">{new Date(run.created_at).toLocaleString()}</p>
            </div>

            <StageCard title="1. Triage Agent — first pass">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{run.agent1_category ?? "—"}</Badge>
                <Badge className={priorityBadgeClass(run.agent1_priority)}>{run.agent1_priority ?? "—"}</Badge>
              </div>
              <p className="text-sm leading-relaxed">{run.agent1_draft ?? "—"}</p>
            </StageCard>

            <StageCard title="2. Policy Auditor — independent check">
              <div className="flex flex-wrap items-center gap-2">
                {run.auditor_verdict && (
                  <Badge className={verdictBadgeClass(run.auditor_verdict)}>
                    {run.auditor_verdict === "approved" ? "Approved" : "Rejected"}
                  </Badge>
                )}
              </div>
              {run.auditor_verdict === "rejected" && (
                <p className="text-sm leading-relaxed">{run.auditor_critique}</p>
              )}
            </StageCard>

            <StageCard
              title={run.auditor_verdict === "rejected" ? "3. Final result — corrected" : "3. Final result"}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{run.final_category ?? "—"}</Badge>
                <Badge className={priorityBadgeClass(run.final_priority)}>{run.final_priority ?? "—"}</Badge>
              </div>
              <p className="text-sm leading-relaxed">{run.final_response ?? "—"}</p>
              {run.citations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {run.citations.map((citation) => (
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
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
      {children}
    </div>
  )
}
