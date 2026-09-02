import { ChatInterface } from "@/components/chat/chat-interface"
import { SiteHeader } from "@/components/site-header"

export default function ChatPage() {
  return (
    <div className="flex h-svh flex-col">
      <SiteHeader />
      <ChatInterface />
    </div>
  )
}
