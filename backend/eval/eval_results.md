# Evaluation Results

Generated: 2026-09-02T13:54:53+00:00

## Summary

- Cases fully correct (final category + priority both match): 9/10 (90%)
- Category accuracy: 9/10 (90%)
- Priority accuracy: 10/10 (100%)
- Policy Auditor rejected the Triage Agent's first pass: 2/10 (20%) - each rejection is a case the two-agent design caught and corrected that a single-agent system would not have.

## Per-ticket results

| # | Ticket | Expected | Final result | Auditor | Passed |
|---|---|---|---|---|---|
| 1 | There is a burst pipe flooding my bathroom right now, wat... | Plumbing / Emergency | Plumbing / Emergency | approved | yes |
| 2 | My kitchen tap has been dripping constantly for the past ... | Plumbing / Routine | Plumbing / Routine | approved | yes |
| 3 | There's no hot water in my unit since this morning. The g... | Plumbing / Urgent | Plumbing / Urgent | approved | yes |
| 4 | I can smell burning and see sparks coming from the wall s... | Electrical / Emergency | Electrical / Emergency | approved | yes |
| 5 | My entire unit has no power at all, but my neighbours' un... | Electrical / Urgent | Electrical / Urgent | rejected → corrected | yes |
| 6 | The plug socket in my guest room isn't working, but every... | Electrical / Routine | Electrical / Routine | approved | yes |
| 7 | Someone is stuck in the lift on the third floor right now... | Elevator/Lift / Emergency | Elevator/Lift / Emergency | approved | yes |
| 8 | There's a big swarm of bees right at the main entrance of... | Pest Control / Urgent | Pest Control / Urgent | approved | yes |
| 9 | The air conditioning in our fully-tenanted office has sto... | HVAC / Urgent | HVAC / Urgent | rejected → corrected | yes |
| 10 | The paint in the lobby is a bit scuffed near the entrance... | Common Area/Grounds / Routine | **Structural/General Building / Routine** | approved | **no** |
