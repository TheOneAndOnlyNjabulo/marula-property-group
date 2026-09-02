export type TriageDraft = {
  category: string
  priority: string
  sla_target: string
  draft_reply: string
}

export type AuditVerdict = {
  verdict: "approved" | "rejected"
  citation: string
  critique: string
  corrected_category: string
  corrected_priority: string
}

export type TriageResult = {
  triage: TriageDraft
  auditor: AuditVerdict
  final: TriageDraft
  citations: string[]
}
