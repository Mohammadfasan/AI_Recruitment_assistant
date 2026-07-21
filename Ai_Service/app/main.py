"""
AI Recruitment Assistant - Main Application
FastAPI server with all routes and configurations
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from loguru import logger
import sys

from app.core.settings import settings
from app.api import resume, matching, ranking, interview, chat
from app.core.chroma import get_chroma_client
from app.core.gemini import get_llm

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan> | <level>{message}</level>",
    level=settings.log_level
)
logger.add(
    "logs/ai_service.log",
    rotation="500 MB",
    retention="10 days",
    level="INFO",
    encoding="utf-8"
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown events"""
    # Startup
    logger.info("=" * 50)
    logger.info("AI Recruitment Assistant Service Starting...")
    logger.info(f"Environment: {settings.log_level}")
    
    # Verify connections
    # Test ChromaDB
    try:
        chroma = get_chroma_client()
        logger.info("ChromaDB connection successful")
    except Exception as e:
        logger.warning(f"ChromaDB connection check failed: {e}. The application will continue starting up.")
        
    # Test Gemini
    try:
        llm = get_llm()
        test_response = await llm.ainvoke("Say 'OK'")
        logger.info("Gemini API connection successful")
    except Exception as e:
        logger.warning(f"Gemini API connection check failed: {e}. The application will continue starting up.")
    
    logger.info("AI Service ready to accept requests")
    logger.info("=" * 50)
    
    yield
    
    # Shutdown
    logger.info("AI Recruitment Assistant Service Shutting Down...")

# Create FastAPI app
app = FastAPI(
    title="AI Recruitment Assistant",
    description="AI-powered recruitment service using Gemini and LangChain",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(resume.router)
app.include_router(matching.router)
app.include_router(ranking.router)
app.include_router(interview.router)
app.include_router(chat.router)

# Health check endpoint
@app.get("/")
@app.get("/health")
async def health_check():
    """Root health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Recruitment Assistant",
        "version": "1.0.0",
        "endpoints": [
            "/resume/upload",
            "/resume/search",
            "/matching/job",
            "/matching/batch",
            "/ranking/candidates",
            "/interview/generate",
            "/chat"
        ]
    }

@app.get("/metrics")
async def get_metrics():
    """Get service metrics (simplified)"""
    from app.vectorstore.chroma_store import chroma_store
    
    stats = chroma_store.get_collection_stats()
    
    return {
        "vector_store": stats,
        "status": "operational"
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level=settings.log_level.lower()
    )