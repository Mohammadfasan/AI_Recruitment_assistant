"""
Pydantic Schemas for Job Matching
Validates matching request/response data
"""

from pydantic import BaseModel, Field
from typing import List, Optional

class JobMatchRequest(BaseModel):
    """Request for matching a candidate to a job"""
    candidate_text: str = Field(..., min_length=1, max_length=10000)
    job_description: str = Field(..., min_length=1, max_length=10000)
    candidate_id: Optional[str] = None
    job_id: Optional[str] = None

class JobMatchResponse(BaseModel):
    """Response for job-candidate matching"""
    match_score: float = Field(..., ge=0, le=100)
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    reasoning: str
    candidate_id: Optional[str] = None
    job_id: Optional[str] = None
    match_percentage: Optional[float] = None
    compare_skills: Optional[str] = None
    compare_experience: Optional[str] = None
    compare_education: Optional[str] = None
    compare_certifications: Optional[str] = None
    match_explanation: Optional[str] = None
    recommendation: Optional[str] = None
    
class BatchMatchRequest(BaseModel):
    """Request for matching multiple candidates to one job"""
    job_description: str = Field(..., min_length=1, max_length=10000)
    candidates: List[str] = Field(..., min_length=1, max_length=50)  # List of candidate texts
    candidate_ids: Optional[List[str]] = None
    
class BatchMatchResponse(BaseModel):
    """Response for batch matching"""
    results: List[JobMatchResponse]
    average_score: float
    top_candidate_id: Optional[str] = None