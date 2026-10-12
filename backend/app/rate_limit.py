"""
Per-IP rate limit shared by every endpoint that calls Gemini. All of these
endpoints draw on the same Gemini quota, so they share one budget per IP rather
than each getting its own.

Rolling window, not a lifetime cap - otherwise a shared office/NAT IP that used up
its requests would be locked out of the demo permanently. Each attempt is recorded
before the agent runs, so a failed request still counts rather than giving a free
retry.
"""

from fastapi import HTTPException, Request

from app.db import count_recent_requests, record_request

RATE_LIMIT_PER_IP = 10
RATE_LIMIT_WINDOW_HOURS = 24


def _get_client_ip(request: Request) -> str:
    """Must be derived server-side - a client-supplied IP would make the limit
    trivially bypassable. Render puts the app behind a proxy, so the real client IP
    arrives via X-Forwarded-For, not request.client.host (the proxy's own address)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(request: Request) -> None:
    ip_address = _get_client_ip(request)
    if count_recent_requests(ip_address, RATE_LIMIT_WINDOW_HOURS) >= RATE_LIMIT_PER_IP:
        raise HTTPException(
            status_code=429,
            detail=f"You've used all {RATE_LIMIT_PER_IP} requests for today. Please try again tomorrow.",
        )
    record_request(ip_address)
