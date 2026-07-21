"""
Chat API Endpoints
AI-powered chat assistant for recruiters
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from loguru import logger

from app.chains.chat_chain import recruiter_chat_chain

class ChatRequest(BaseModel):
    """Request for chat assistant"""
    question: str = Field(..., min_length=1, max_length=2000)
    candidate_context: Optional[str] = None
    job_context: Optional[str] = None

class ChatResponse(BaseModel):
    """Response from chat assistant"""
    answer: str
    question: str

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    """
    Chat with AI Recruitment Assistant
    
    - Ask questions about candidates
    - Get recruitment advice
    - Understand candidate-job fit
    """
    try:
        answer = await recruiter_chat_chain.chat(
            question=request.question,
            candidate_context=request.candidate_context or "",
            job_context=request.job_context or ""
        )
        
        if not answer:
            raise HTTPException(status_code=400, detail="Failed to generate response")
        
        response = ChatResponse(
            answer=answer,
            question=request.question
        )
        
        logger.info(f"Chat response generated for question: {request.question[:50]}...")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@router.get("/suggestions")
async def get_suggestion_topics():
    """Get suggested questions for recruiters"""
    suggestions = [
        "Who is the best candidate for the Senior Developer position?",
        "What are the top skills among our candidates?",
        "Which candidates have experience with Python and Machine Learning?",
        "How can I improve the job description to attract better candidates?",
        "What interview questions should I ask for this role?",
        "Compare candidate A and candidate B for the position",
        "What are the common gaps in our candidate pool?",
        "Suggest next steps for the hiring process"
    ]
    
    return {"suggested_questions": suggestions}