from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.db import init_db
from backend.app.routers import health, auth, agent


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database schema
    init_db()
    yield
    # Teardown logic if needed


app = FastAPI(
    title="ProveIt Backend API",
    description="Autonomous AWS Deployment & Self-Healing Agent API with Deterministic Policy Verification",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(agent.router)
app.include_router(agent.benchmark_router)

