"""MediVault API — FastAPI application entrypoint."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import settings
from .database import Base, engine
from .routers import auth, consents, family, files, profile, reports

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medivault")


def _run_migrations():
    """Idempotent schema migrations that create_all cannot handle."""
    is_sqlite = settings.sqlalchemy_url.startswith("sqlite")
    with engine.begin() as conn:
        if is_sqlite:
            # SQLite does not enforce VARCHAR lengths; nothing to do.
            return
        # Widen phone column from VARCHAR(15) → VARCHAR(255) and make nullable
        # so that Supabase email-auth users can be auto-created.
        conn.execute(text(
            "DO $$ BEGIN "
            "ALTER TABLE users ALTER COLUMN phone TYPE VARCHAR(255); "
            "EXCEPTION WHEN OTHERS THEN NULL; END $$;"
        ))
        conn.execute(text(
            "DO $$ BEGIN "
            "ALTER TABLE users ALTER COLUMN phone DROP NOT NULL; "
            "EXCEPTION WHEN OTHERS THEN NULL; END $$;"
        ))


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    try:
        _run_migrations()
    except Exception as exc:
        logger.warning("Migration step failed (non-fatal): %s", exc)
    yield

app = FastAPI(
    title="MediVault API",
    description="Medical report storage backend — auth, profiles, family, reports.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard error envelope to match the frontend's expected shape.
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {"code": "ERROR", "message": exc.detail},
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Validation failed",
                "details": exc.errors(),
            },
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {"code": "SERVER_ERROR", "message": str(exc)},
        },
    )


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "service": "medivault-api"}


@app.get("/", tags=["meta"])
def root():
    return {
        "service": "MediVault API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# All API routes are mounted under /v1 to match the frontend NEXT_PUBLIC_API_URL.
API_PREFIX = "/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(profile.router, prefix=API_PREFIX)
app.include_router(family.router, prefix=API_PREFIX)
app.include_router(reports.router, prefix=API_PREFIX)
app.include_router(consents.router, prefix=API_PREFIX)
app.include_router(files.router, prefix=API_PREFIX)
