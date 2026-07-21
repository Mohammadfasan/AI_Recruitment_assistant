"""
Matching API Endpoints
Handles job-candidate matching and batch matching
"""

from fastapi import APIRouter, HTTPException
from loguru import logger

from app.schemas.matching_schema import (
    JobMatchRequest, 
    JobMatchResponse, 
    BatchMatchRequest,
    BatchMatchResponse
)
from app.services.job_matcher import job_matcher_service

router = APIRouter(prefix="/matching", tags=["Matching"])

@router.post("/job", response_model=JobMatchResponse)
async def match_candidate_to_job(request: JobMatchRequest):
    """
    Match a single candidate to a job description
    
    - Analyzes skills match
    - Calculates overall fit score
    - Provides reasoning
    """
    try:
        result = await job_matcher_service.match_single(
            request.job_description,
            request.candidate_text
        )
        
        if not result:
            raise HTTPException(status_code=400, detail="Matching failed. Please check input texts.")
        
        response = JobMatchResponse(
            match_score=result.get("match_score", 0),
            matched_skills=result.get("matched_skills", []),
            missing_skills=result.get("missing_skills", []),
            reasoning=result.get("reasoning", ""),
            candidate_id=request.candidate_id,
            job_id=request.job_id,
            match_percentage=result.get("match_percentage", result.get("match_score", 0)),
            compare_skills=result.get("compare_skills", ""),
            compare_experience=result.get("compare_experience", ""),
            compare_education=result.get("compare_education", ""),
            compare_certifications=result.get("compare_certifications", ""),
            match_explanation=result.get("match_explanation", ""),
            recommendation=result.get("recommendation", "Manual Review")
        )
        
        logger.info(f"Matching completed with score: {response.match_score}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in job matching: {e}")
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")

@router.post("/batch", response_model=BatchMatchResponse)
async def batch_match_candidates(request: BatchMatchRequest):
    """
    Match multiple candidates to a single job
    
    - Efficiently processes multiple candidates
    - Returns all match scores
    - Identifies top candidate
    """
    try:
        # Prepare candidates list
        candidates = []
        for i, text in enumerate(request.candidates):
            candidate_id = request.candidate_ids[i] if request.candidate_ids and i < len(request.candidate_ids) else None
            candidates.append({
                "id": candidate_id or f"candidate_{i}",
                "text": text
            })
        
        # Perform batch matching
        results = await job_matcher_service.match_batch(
            request.job_description,
            candidates
        )
        
        if not results:
            raise HTTPException(status_code=400, detail="Batch matching failed")
        
        # Calculate average score
        avg_score = sum(r.get("match_score", 0) for r in results) / len(results) if results else 0
        
        # Get top candidate
        top_candidate_id = results[0].get("candidate_id") if results else None
        
        # Convert to response models
        match_responses = [
            JobMatchResponse(
                match_score=r.get("match_score", 0),
                matched_skills=r.get("matched_skills", []),
                missing_skills=r.get("missing_skills", []),
                reasoning=r.get("reasoning", ""),
                candidate_id=r.get("candidate_id"),
                match_percentage=r.get("match_percentage", r.get("match_score", 0)),
                compare_skills=r.get("compare_skills", ""),
                compare_experience=r.get("compare_experience", ""),
                compare_education=r.get("compare_education", ""),
                compare_certifications=r.get("compare_certifications", ""),
                match_explanation=r.get("match_explanation", ""),
                recommendation=r.get("recommendation", "Manual Review")
            )
            for r in results
        ]
        
        response = BatchMatchResponse(
            results=match_responses,
            average_score=avg_score,
            top_candidate_id=top_candidate_id
        )
        
        logger.info(f"Batch matching completed for {len(results)} candidates")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch matching: {e}")
        raise HTTPException(status_code=500, detail=f"Batch matching failed: {str(e)}")