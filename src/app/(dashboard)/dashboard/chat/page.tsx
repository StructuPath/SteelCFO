"use client"

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
}

const suggestions = [
  "Give me this week's CFO brief",
  "Which jobs have the highest risk right now?",
  "What's our cash position and 13-week outlook?",
  "Show me the AR aging — who owes us money?",
  "Which jobs are underbilled and by how much?",
  "What change orders are pending approval?",
]

// Allowlist of safe HTML tags produced by our markdown transform.
// Strips anything not in this set to prevent XSS.
const ALLOWED_TAGS = new Set([
  "h1", "h2", "h3", "strong", "em", "ul", "li", "p", "br",
])

function stripUnsafeTags(html: string): string {
  // Remove any tag not in the allowlist
  return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
    return ALLOWED_TAGS.has(tag.toLowerCase()) ? match : ""
  })
}

function formatMarkdown(text: string): string {
  if (!text) return ""
  // Escape all HTML entities first
  let safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")

  // Apply markdown transforms on escaped content
  safe = safe
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
    .replace(/<\/ul>\s*<ul>/g, "")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")

  // Final safety pass — strip anything that shouldn't be there
  return stripUnsafeTags(safe)
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(
    []
  )
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    })
  }, [messages])

  // Load persisted history for signed-in users
  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/chat", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.messages?.length) {
          setMessages(data.messages)
        }
      })
      .catch(() => {
        // History is best-effort; the chat works without it
      })
    return () => controller.abort()
  }, [])

  const clearHistory = useCallback(async () => {
    setMessages([])
    try {
      await fetch("/api/chat", { method: "DELETE" })
    } catch {
      // Best-effort
    }
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      const userMessage: Message = {
        role: "user",
        content: content.trim(),
      }
      const newMessages = [...messages, userMessage]
      setMessages(newMessages)
      setInput("")
      setIsLoading(true)

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: newMessages,
          }),
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(
            err.error || "Failed to get response"
          )
        }

        const reader = response.body?.getReader()
        if (!reader)
          throw new Error("No response body")

        const decoder = new TextDecoder()
        let assistantContent = ""
        // SSE lines can be split across network reads — buffer the
        // remainder so partial `data:` lines aren't dropped
        let buffer = ""

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "" },
        ])

        const processLine = (line: string) => {
          if (!line.startsWith("data: ")) return
          const data = line.slice(6)
          if (data === "[DONE]") return
          try {
            const parsed = JSON.parse(data)
            if (typeof parsed.text !== "string") return
            assistantContent += parsed.text
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                role: "assistant",
                content: assistantContent,
              }
              return updated
            })
          } catch {
            // Skip malformed SSE chunks
          }
        }

        while (true) {
          const { done, value } =
            await reader.read()
          if (done) break

          buffer += decoder.decode(value, {
            stream: true,
          })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""
          for (const line of lines) {
            processLine(line)
          }
        }
        buffer += decoder.decode()
        if (buffer) processLine(buffer)
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : "An error occurred"
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${errorMsg}`,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading]
  )

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      {/* Page header */}
      <div className="mb-4">
        <div className="mb-1 flex items-center gap-3">
          <span className="text-xl text-neon-magenta">
            ◉
          </span>
          <h1 className="font-display text-xl font-bold uppercase tracking-[0.15em] text-neon-magenta text-glow-magenta">
            Neural Interface
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-px w-4 bg-neon-magenta/30" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hud-dim">
            {"STEELCFO // NEURAL v2.0"} — Full data
            access
          </p>
          <span className="h-1.5 w-1.5 animate-glow-pulse rounded-full bg-neon-green" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neon-green/70">
            ONLINE
          </span>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              disabled={isLoading}
              className="ml-auto rounded-sm border border-grid-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-hud-dim transition-colors hover:border-neon-red/40 hover:text-neon-red disabled:opacity-40"
            >
              Clear Session
            </button>
          )}
        </div>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        {/* Messages area */}
        <CardContent className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
          {messages.length === 0 ? (
            /* ---- Empty state ---- */
            <div className="flex h-full flex-col items-center justify-center space-y-6">
              <div className="text-center">
                {/* HUD icon */}
                <div className="mb-4 flex items-center justify-center">
                  <div className="hud-corners flex h-20 w-20 items-center justify-center rounded-sm border border-neon-magenta/30 bg-neon-magenta/5 shadow-neon-magenta">
                    <div className="text-center">
                      <p className="font-display text-lg font-bold text-neon-magenta text-glow-magenta">
                        AI
                      </p>
                      <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-neon-magenta/50">
                        NEURAL
                      </p>
                    </div>
                  </div>
                </div>
                <h2 className="font-display text-lg font-semibold uppercase tracking-[0.15em] text-hud-text">
                  Steel CFO Neural
                </h2>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-hud-dim">
                  Full financial data access · Real-time
                  analysis
                </p>
              </div>

              {/* Section label */}
              <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-neon-cyan/20" />
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-hud-dim">
                  {"// Suggested Queries"}
                </p>
                <span className="h-px w-6 bg-neon-cyan/20" />
              </div>

              <div className="grid w-full max-w-2xl gap-2 md:grid-cols-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="rounded-sm border border-grid-line bg-cyber-deep/60 p-3 text-left font-mono text-[11px] text-hud-muted transition-all hover:border-neon-cyan/30 hover:bg-cyber-surface hover:text-neon-cyan hover:shadow-neon-cyan"
                  >
                    <span className="mr-2 text-hud-dim">
                      ▸
                    </span>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ---- Message history ---- */
            messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-sm px-4 py-3",
                    msg.role === "user"
                      ? "border border-neon-cyan/30 bg-neon-cyan/20 text-hud-text"
                      : "border border-grid-line bg-cyber-dark/80 text-hud-text"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div
                      className="prose prose-invert prose-sm max-w-none
                        prose-headings:font-display prose-headings:font-semibold prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-neon-cyan
                        prose-strong:text-hud-text
                        prose-li:text-hud-muted prose-li:font-mono prose-li:text-xs
                        prose-p:text-hud-muted prose-p:font-mono prose-p:text-xs"
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: formatMarkdown(
                            msg.content
                          ),
                        }}
                      />
                      {isLoading &&
                        i ===
                          messages.length - 1 && (
                          <span className="ml-1 inline-block h-4 w-2 animate-glow-pulse bg-neon-cyan shadow-[0_0_6px_rgba(0,255,255,0.6)]" />
                        )}
                    </div>
                  ) : (
                    <p className="font-mono text-xs">
                      {msg.content}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input area */}
        <div className="border-t border-grid-line p-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-neon-cyan/40">
              {">_"}
            </span>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Query the neural network..."
              className="flex-1 resize-none rounded-sm border border-grid-line bg-cyber-dark/60 px-4 py-3 font-mono text-xs text-hud-text placeholder:text-hud-dim focus:border-neon-cyan/50 focus:shadow-neon-cyan focus:outline-none"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={
                !input.trim() || isLoading
              }
              loading={isLoading}
            >
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
