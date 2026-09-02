import type { TicketRunDetail, TicketRunSummary } from "@/lib/admin-types"
import type { Source } from "@/lib/chat-types"
import type { TriageResult } from "@/lib/triage-types"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export type ChatApiResponse = {
  answer: string
  sources: Source[]
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function submitTicket(ticketText: string): Promise<TriageResult> {
  if (!API_URL) {
    throw new ApiError(0, "NEXT_PUBLIC_API_URL is not configured.")
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}/triage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_text: ticketText }),
    })
  } catch {
    throw new ApiError(0, "Couldn't reach the helpdesk. Check your connection and try again.")
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = body?.detail
    throw new ApiError(response.status, detail ?? "Failed to triage this ticket. Please try again.")
  }

  return response.json()
}

export async function sendChatMessage(question: string): Promise<ChatApiResponse> {
  if (!API_URL) {
    throw new ApiError(0, "NEXT_PUBLIC_API_URL is not configured.")
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    })
  } catch {
    throw new ApiError(0, "Couldn't reach the assistant. Check your connection and try again.")
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = body?.detail
    throw new ApiError(response.status, detail ?? "Failed to generate an answer. Please try again.")
  }

  return response.json()
}

export async function fetchTicketRuns(): Promise<TicketRunSummary[]> {
  if (!API_URL) {
    throw new ApiError(0, "NEXT_PUBLIC_API_URL is not configured.")
  }

  const response = await fetch(`${API_URL}/admin/tickets`)
  if (!response.ok) {
    throw new ApiError(response.status, "Failed to load ticket runs.")
  }
  return response.json()
}

export async function fetchTicketRun(id: string): Promise<TicketRunDetail> {
  if (!API_URL) {
    throw new ApiError(0, "NEXT_PUBLIC_API_URL is not configured.")
  }

  const response = await fetch(`${API_URL}/admin/tickets/${id}`)
  if (!response.ok) {
    throw new ApiError(
      response.status,
      response.status === 404 ? "Ticket run not found." : "Failed to load ticket run."
    )
  }
  return response.json()
}
