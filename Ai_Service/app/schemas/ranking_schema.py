"""
Pydantic Schemas for Candidate Ranking
Validates ranking request/response data
"""

from pydantic import BaseModel, Field
from typing import List, Optional

class CandidateInput(BaseModel):
    """Individual candidate for ranking"""
    id: str
    text: str = Field(..., min_length=1, max_length=10000)
    name: Optional[str] = None

class RankingRequest(BaseModel):
    """Request for ranking candidates"""
    job_description: str = Field(..., min_length=1, max_length=10000)
    candidates: List[CandidateInput] = Field(..., min_length=1, max_length=20)

class RankedCandidate(BaseModel):
    """Ranked candidate result"""
    candidate_id: str
    rank: int = Field(..., ge=1)
    score: float = Field(..., ge=0, le=100)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    recommendation: str

class RankingResponse(BaseModel):
    """Response for ranking request"""
    rankings: List[RankedCandidate]
    job_description_summary: Optional[str] = None
    total_candidates: int