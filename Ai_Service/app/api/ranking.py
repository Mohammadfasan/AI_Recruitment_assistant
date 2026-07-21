"""
Ranking API Endpoints
Handles ranking of multiple candidates for a job
"""

from fastapi import APIRouter, HTTPException
from loguru import logger

from app.schemas.ranking_schema import RankingRequest, RankingResponse, RankedCandidate
from app.services.candidate_ranker import candidate_ranker_service

router = APIRouter(prefix="/ranking", tags=["Ranking"])

@router.post("/candidates", response_model=RankingResponse)
async def rank_candidates(request: RankingRequest):
    """
    Rank candidates for a specific job
    
    - Analyzes all candidates
    - Provides ranking with scores
    - Includes strengths/weaknesses per candidate
    """
    try:
        # Prepare candidates list
        candidates = [
            {"id": c.id, "text": c.text, "name": c.name}
            for c in request.candidates
        ]
        
        # Get rankings
        rankings = await candidate_ranker_service.rank_candidates(
            request.job_description,
            candidates
        )
        
        if not rankings:
            raise HTTPException(status_code=400, detail="Ranking failed")
        
        # Convert to response models
        ranked_candidates = [
            RankedCandidate(
                candidate_id=r.get("candidate_id", ""),
                rank=r.get("rank", i + 1),
                score=r.get("score", 0),
                strengths=r.get("strengths", []),
                weaknesses=r.get("weaknesses", []),
                recommendation=r.get("recommendation", "")
            )
            for i, r in enumerate(rankings)
        ]
        
        response = RankingResponse(
            rankings=ranked_candidates,
            total_candidates=len(ranked_candidates)
        )
        
        logger.info(f"Ranking completed for {len(ranked_candidates)} candidates")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ranking candidates: {e}")
        raise HTTPException(status_code=500, detail=f"Ranking failed: {str(e)}")

@router.post("/candidates/top")
async def get_top_candidates(request: RankingRequest, top_n: int = 5):
    """
    Get only top N ranked candidates
    """
    try:
        candidates = [
            {"id": c.id, "text": c.text, "name": c.name}
            for c in request.candidates
        ]
        
        rankings = await candidate_ranker_service.rank_candidates(
            request.job_description,
            candidates
        )
        
        if not rankings:
            raise HTTPException(status_code=400, detail="Ranking failed")
        
        top_candidates = candidate_ranker_service.get_top_candidates(rankings, top_n)
        
        return {
            "top_candidates": top_candidates,
            "total_ranked": len(rankings),
            "returned": len(top_candidates)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting top candidates: {e}")
        raise HTTPException(status_code=500, detail=f"Operation failed: {str(e)}")