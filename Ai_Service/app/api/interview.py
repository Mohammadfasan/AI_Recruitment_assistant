"""
Interview API Endpoints
Generates interview questions from job descriptions
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from loguru import logger

from app.services.interview_generator import interview_generator_service

class InterviewQuestion(BaseModel):
    """Single interview question"""
    question: str
    tests: Optional[str] = None
    expected_key_points: List[str] = Field(default_factory=list)

class InterviewQuestionsResponse(BaseModel):
    """Response with generated interview questions"""
    technical_questions: List[InterviewQuestion] = Field(default_factory=list)
    behavioral_questions: List[InterviewQuestion] = Field(default_factory=list)
    scenario_questions: List[InterviewQuestion] = Field(default_factory=list)
    coding_questions: List[InterviewQuestion] = Field(default_factory=list)

class InterviewRequest(BaseModel):
    """Request for generating interview questions"""
    job_title: str = Field(..., min_length=1, max_length=500)
    required_skills: str = Field(default="")
    candidate_resume: str = Field(default="")

router = APIRouter(prefix="/interview", tags=["Interview"])

@router.post("/generate", response_model=InterviewQuestionsResponse)
async def generate_interview_questions(request: InterviewRequest):
    """
    Generate interview questions based on job requirements and candidate resume
    
    - Creates technical questions
    - Creates behavioral questions  
    - Creates scenario questions
    - Creates coding questions
    """
    try:
        questions = await interview_generator_service.generate_questions(
            request.job_title,
            request.required_skills,
            request.candidate_resume
        )
        
        if not questions:
            raise HTTPException(status_code=400, detail="Failed to generate questions")
        
        # Convert to response model
        response = InterviewQuestionsResponse(
            technical_questions=[
                InterviewQuestion(**q) for q in questions.get("technical_questions", [])
            ],
            behavioral_questions=[
                InterviewQuestion(**q) for q in questions.get("behavioral_questions", [])
            ],
            scenario_questions=[
                InterviewQuestion(**q) for q in questions.get("scenario_questions", [])
            ],
            coding_questions=[
                InterviewQuestion(**q) for q in questions.get("coding_questions", [])
            ]
        )
        
        logger.info(f"Generated interview questions for job: {request.job_title}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating interview questions: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@router.post("/generate/technical")
async def generate_technical_questions_only(job_title: str, required_skills: str, candidate_resume: str):
    """Generate only technical questions"""
    try:
        questions = await interview_generator_service.generate_questions(job_title, required_skills, candidate_resume)
        
        if not questions:
            raise HTTPException(status_code=400, detail="Failed to generate questions")
        
        return {"technical_questions": questions.get("technical_questions", [])}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating technical questions: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")