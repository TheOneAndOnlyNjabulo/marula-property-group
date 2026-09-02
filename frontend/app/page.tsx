import { SiteHeader } from "@/components/site-header"
import { TicketForm } from "@/components/ticketing/ticket-form"

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <TicketForm />
    </div>
  )
}
