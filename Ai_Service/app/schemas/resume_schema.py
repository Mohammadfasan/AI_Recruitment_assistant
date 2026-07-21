"""
Pydantic Schemas for Resume Data
Validates request/response data for resume operations
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
from uuid import UUID, uuid4

class Education(BaseModel):
    """Education entry schema"""
    degree: Optional[str] = None
    institution: Optional[str] = None
    year: Optional[str] = None
    
class Experience(BaseModel):
    """Work experience entry schema"""
    title: Optional[str] = None
    company: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None

class ParsedResume(BaseModel):
    """Structured resume data after parsing"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    education: List[Education] = Field(default_factory=list)
    experience: List[Experience] = Field(default_factory=list)
    summary: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    raw_text: Optional[str] = None
    resume_score: Optional[float] = None
    suggestions: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)

class ResumeUploadResponse(BaseModel):
    """Response after uploading and parsing resume"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    parsed_data: ParsedResume
    embedding_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
class ResumeSearchQuery(BaseModel):
    """Query for searching resumes"""
    query_text: str = Field(..., min_length=3, max_length=500)
    top_k: int = Field(default=5, ge=1, le=20)
    
class ResumeSearchResult(BaseModel):
    """Individual search result"""
    id: str
    similarity_score: float = Field(..., ge=0, le=1)
    parsed_data: ParsedResume
    
class ResumeSearchResponse(BaseModel):
    """Response for resume search"""
    results: List[ResumeSearchResult]
    total_results: int