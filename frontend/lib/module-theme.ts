// Each section owns one flat accent colour (defined in globals.css), used for its
// page header mark and "how it works" block. Class names are spelled out in full
// so Tailwind can see them at build time.
export type ModuleAccent = "ticket" | "chat"

export const ACCENT_BG: Record<ModuleAccent, string> = {
  ticket: "bg-ticket",
  chat: "bg-chat",
}
