export type TicketRunSummary = {
  id: string
  ticket_text: string
  agent1_category: string | null
  agent1_priority: string | null
  auditor_verdict: string | null
  final_category: string | null
  final_priority: string | null
  created_at: string
}

export type TicketRunDetail = {
  id: string
  ticket_text: string
  agent1_category: string | null
  agent1_priority: string | null
  agent1_draft: string | null
  auditor_verdict: string | null
  auditor_critique: string | null
  final_category: string | null
  final_priority: string | null
  final_response: string | null
  citations: string[]
  created_at: string
}
