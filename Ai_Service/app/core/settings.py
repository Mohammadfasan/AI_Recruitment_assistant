"""
Settings management for AI Service
Loads configuration from environment variables
"""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field
from pathlib import Path

class Settings(BaseSettings):
    """Application settings"""
    
    # Gemini API
    gemini_api_key: str = Field(..., env="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash", env="GEMINI_MODEL")  # Latest Gemini Flash model
    
    # ChromaDB
    chroma_db_path: Path = Field(default=Path("./chroma_db"), env="CHROMA_DB_PATH")
    chroma_collection_name: str = "resume_embeddings"
    
    # Server
    host: str = Field(default="0.0.0.0", env="AI_SERVICE_HOST")
    port: int = Field(default=8001, env="AI_SERVICE_PORT")
    
    # CORS
    allowed_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        env="ALLOWED_ORIGINS"
    )
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # File uploads
    upload_dir: Path = Path("./uploads/resumes")
    max_file_size_mb: int = 10
    
    # Embedding
    embedding_model: str = Field(default="models/gemini-embedding-001", env="EMBEDDING_MODEL")
    embedding_dimension: int = 3072
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"

# Create global settings instance
settings = Settings()

# Ensure upload directory exists
settings.upload_dir.mkdir(parents=True, exist_ok=True)