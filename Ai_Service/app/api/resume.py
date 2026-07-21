"""
Resume API Endpoints
Handles resume upload, parsing, and embedding
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import List
from loguru import logger
import uuid

from app.schemas.resume_schema import ResumeUploadResponse, ParsedResume, ResumeSearchQuery, ResumeSearchResponse
from app.services.resume_parser import resume_parser_service
from app.services.embedding_service import embedding_service

router = APIRouter(prefix="/resume", tags=["Resume"])

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Upload and parse a resume PDF file
    
    - Extracts text from PDF
    - Uses AI to parse structured information
    - Generates embedding and stores in vector database
    """
    try:
        # Validate file type
        filename_lower = file.filename.lower()
        if not (filename_lower.endswith('.pdf') or filename_lower.endswith('.docx')):
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")
        
        # Read file content
        content = await file.read()
        
        # Check file size (max 10MB)
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        # Parse resume
        parsed_data = await resume_parser_service.parse_from_bytes(content, file.filename)
        
        if not parsed_data:
            raise HTTPException(status_code=400, detail="Failed to parse resume. Please check the file format.")
        
        # Generate ID for this resume
        resume_id = str(uuid.uuid4())
        
        # Save embedding in background (don't block response)
        background_tasks.add_task(
            embedding_service.save_resume_embedding,
            resume_id,
            parsed_data.get("raw_text", ""),
            {
                "name": parsed_data.get("name") or "Unknown",
                "email": parsed_data.get("email") or "",
                "skills_count": len(parsed_data.get("skills") or []),
                "resume_id": resume_id
            }
        )
        
        # Create response
        parsed_schema = ParsedResume(
            name=parsed_data.get("name"),
            email=parsed_data.get("email"),
            phone=parsed_data.get("phone"),
            skills=parsed_data.get("skills", []),
            education=parsed_data.get("education", []),
            experience=parsed_data.get("experience", []),
            summary=parsed_data.get("summary"),
            github=parsed_data.get("github"),
            linkedin=parsed_data.get("linkedin"),
            raw_text=parsed_data.get("raw_text"),
            resume_score=parsed_data.get("resume_score"),
            suggestions=parsed_data.get("suggestions", []),
            missing_skills=parsed_data.get("missing_skills", [])
        )
        
        response = ResumeUploadResponse(
            id=resume_id,
            parsed_data=parsed_schema
        )
        
        logger.info(f"Successfully uploaded resume for: {parsed_data.get('name', 'Unknown')}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in resume upload: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/search", response_model=ResumeSearchResponse)
async def search_similar_resumes(query: ResumeSearchQuery):
    """
    Search for similar resumes using vector similarity
    
    - Converts query to embedding
    - Searches ChromaDB for similar resumes
    - Returns ranked results
    """
    try:
        results = await embedding_service.search_similar_candidates(
            query.query_text,
            query.top_k
        )
        
        return ResumeSearchResponse(
            results=results,
            total_results=len(results)
        )
        
    except Exception as e:
        logger.error(f"Error searching resumes: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Check if resume service is operational"""
    return {"status": "healthy", "service": "resume"}