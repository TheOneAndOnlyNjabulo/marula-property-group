"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Badge } from "@/components/ui/badge"
import { ApiError, fetchTicketRuns } from "@/lib/api"
import { priorityBadgeClass, verdictBadgeClass } from "@/lib/badge-utils"
import type { TicketRunSummary } from "@/lib/admin-types"

export default function AdminPage() {
  const [runs, setRuns] = React.useState<TicketRunSummary[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchTicketRuns()
      .then(setRuns)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load ticket runs."))
  }, [])

  return (
    <AppShell>
      <div className="h-full overflow-y-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ticket runs</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every triage run, with the Triage Agent&apos;s first pass and the Policy Auditor&apos;s verdict.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!runs && !error && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading ticket runs...
            </div>
          )}

          {runs && runs.length === 0 && (
            <p className="text-sm text-muted-foreground">No ticket runs yet. Submit a ticket to see it here.</p>
          )}

          {runs && runs.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {runs.map((run) => (
                <Link
                  key={run.id}
                  href={`/admin/${run.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{run.agent1_category ?? "—"}</Badge>
                    <Badge className={priorityBadgeClass(run.agent1_priority)}>{run.agent1_priority ?? "—"}</Badge>
                    {run.auditor_verdict && (
                      <Badge className={verdictBadgeClass(run.auditor_verdict)}>
                        {run.auditor_verdict === "approved" ? "Approved" : "Rejected"}
                      </Badge>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm text-foreground">{run.ticket_text}</p>
                  <span className="mt-auto text-xs text-muted-foreground">
                    {new Date(run.created_at).toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
