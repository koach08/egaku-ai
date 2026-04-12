"""EGAKU AI - Commercial Backend API."""

import logging
import time
from collections import defaultdict

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import adult, anonymous, api_keys, auth, billing, chat, credits, download, explore, feedback, gallery, generate, generate_advanced, models, optimize, tts, webhook
from app.core.config import get_settings
from app.core.security import get_client_ip

logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Rate Limiting Middleware ---
# In-memory for dev; replace with Redis (Upstash) in production
_rate_limits: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = 60  # requests per window
RATE_WINDOW = 60  # seconds


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for webhooks and health
    if request.url.path.startswith("/api/webhooks") or request.url.path == "/api/health":
        return await call_next(request)

    ip = get_client_ip(request)
    now = time.time()
    # Clean old entries
    _rate_limits[ip] = [t for t in _rate_limits[ip] if now - t < RATE_WINDOW]

    if len(_rate_limits[ip]) >= RATE_LIMIT:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."},
        )

    _rate_limits[ip].append(now)
    response: Response = await call_next(request)
    response.headers["X-RateLimit-Remaining"] = str(RATE_LIMIT - len(_rate_limits[ip]))
    return response


# --- Security Headers Middleware ---
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(explore.router, prefix="/api")
app.include_router(generate.router, prefix="/api")
app.include_router(anonymous.router, prefix="/api")
app.include_router(generate_advanced.router, prefix="/api")
app.include_router(credits.router, prefix="/api")
app.include_router(gallery.router, prefix="/api")
app.include_router(models.router, prefix="/api")
app.include_router(webhook.router, prefix="/api")
app.include_router(api_keys.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(download.router, prefix="/api")
app.include_router(tts.router, prefix="/api")
app.include_router(adult.router, prefix="/api")
app.include_router(optimize.router, prefix="/api")

from app.api import projects
app.include_router(projects.router, prefix="/api")

from app.api import announcements
app.include_router(announcements.router, prefix="/api")

app.include_router(feedback.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": settings.app_name, "mode": settings.mode}
