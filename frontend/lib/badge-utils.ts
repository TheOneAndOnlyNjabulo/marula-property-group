export function priorityBadgeClass(priority: string | null) {
  switch (priority) {
    case "Emergency":
      return "bg-destructive text-destructive-foreground"
    case "Urgent":
      return "bg-amber-500 text-white"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

export function verdictBadgeClass(verdict: string | null) {
  return verdict === "approved" ? "bg-emerald-600 text-white" : "bg-destructive text-destructive-foreground"
}
