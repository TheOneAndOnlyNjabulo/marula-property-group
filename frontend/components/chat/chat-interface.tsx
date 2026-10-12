"use client"

import * as React from "react"
import { MessageCircleQuestion, Send } from "lucide-react"
import ReactMarkdown from "react-markdown"

import { PageHeader } from "@/components/page-header"
import { SlowRequestHint } from "@/components/server-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ChatMessage } from "@/lib/chat-types"
import { ApiError, sendChatMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "seed-1",
    role: "assistant",
    content:
      "Hi, I'm the Marula Property Group Assistant. Ask me about maintenance priorities, SLA response times, " +
      "specific trades, tenant vs. landlord responsibility, or any of our other policies.",
  },
]

// Picking one only fills the input - the visitor reads/edits it and sends it.
const SAMPLE_QUESTIONS = [
  "What counts as an emergency maintenance request?",
  "Who pays for a blocked drain caused by grease going down the sink?",
  "How quickly will an urgent ticket get a response?",
  "pest control",
]

function nextId() {
  return Math.random().toString(36).slice(2)
}

export function ChatInterface() {
  const [messages, setMessages] = React.useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isSending])

  const canSend = input.trim().length > 0 && !isSending

  async function handleSend() {
    if (!canSend) return

    const question = input.trim()
    setMessages((prev) => [...prev, { id: nextId(), role: "user", content: question }])
    setInput("")
    setIsSending(true)

    try {
      const result = await sendChatMessage(question)
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: result.answer, sources: result.sources },
      ])
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again."
      setMessages((prev) => [...prev, { id: nextId(), role: "error", content: message }])
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden">
      <PageHeader
        accent="chat"
        icon={MessageCircleQuestion}
        eyebrow="Retrieval-augmented"
        title="Ask a Question"
        description="Ask about maintenance priorities, SLA times, trades, or tenant vs. landlord responsibility - answered and cited from Marula's policy documents."
      />

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {messages.length === INITIAL_MESSAGES.length && !isSending && (
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => {
                    setInput(question)
                    inputRef.current?.focus()
                  }}
                  className="rounded-full bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground transition-[color,background-color,transform] hover:bg-primary active:scale-95 hover:text-primary-foreground"
                >
                  {question}
                </button>
              ))}
            </div>
          )}
          {isSending && (
            <div className="flex flex-col gap-2">
              <TypingIndicator />
              <SlowRequestHint />
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center gap-2 rounded-full bg-muted p-1.5 pl-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            disabled={isSending}
            aria-label="Your question"
            className="bg-transparent focus-visible:ring-0"
          />
          <Button onClick={handleSend} disabled={!canSend} size="icon" aria-label="Send">
            <Send className="size-4" />
          </Button>
        </div>
      </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "error") {
    return (
      <div className="flex animate-rise flex-col items-start">
        <div className="max-w-[85%] rounded-3xl bg-destructive/10 px-5 py-3 text-sm leading-relaxed text-destructive">
          {message.content}
        </div>
      </div>
    )
  }

  const isUser = message.role === "user"

  return (
    <div className={cn("flex animate-rise flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-3xl px-5 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-br-lg bg-primary text-primary-foreground whitespace-pre-wrap"
            : "rounded-bl-lg bg-card text-card-foreground"
        )}
      >
        {isUser ? message.content : <MarkdownContent content={message.content} />}
      </div>
      {!isUser && message.sources && message.sources.length > 0 && (
        <div className="mt-1.5 flex max-w-[85%] flex-wrap gap-1.5">
          {message.sources.map((s) => (
            <span
              key={`${s.document}-${s.section}`}
              className="rounded-full bg-muted px-2.5 py-1 font-mono text-[10px] text-muted-foreground"
            >
              {s.document} <span className="font-semibold text-foreground">§{s.section}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-2 [&>*:last-child]:mb-0">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
          ul: ({ children }) => <ul className="ml-4 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="ml-4 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          a: ({ children, href }) => (
            <a href={href} className="text-primary underline underline-offset-2">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex animate-rise items-start">
      <div className="flex items-center gap-1 rounded-3xl rounded-bl-lg bg-card px-5 py-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
