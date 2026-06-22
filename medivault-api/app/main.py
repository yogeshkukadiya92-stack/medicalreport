"""MediVault API — FastAPI application entrypoint."""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import settings
from .database import Base, engine
from .routers import auth, consents, family, files, profile, reports

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medivault")

# Create tables on startup (simple bootstrap; use Alembic for real migrations).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MediVault API",
    description="Medical report storage backend — auth, profiles, family, reports.",
    version="1.0.0",
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
