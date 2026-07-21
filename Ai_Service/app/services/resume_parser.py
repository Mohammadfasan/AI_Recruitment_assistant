"""
Resume Parser Service
Orchestrates PDF parsing, text cleaning, and AI extraction
"""

from typing import Dict, Any, Optional
from pathlib import Path
from loguru import logger

from app.utils.pdf_reader import (
    extract_text_from_pdf, 
    extract_text_from_pdf_bytes,
    extract_text_from_docx,
    extract_text_from_docx_bytes
)
from app.utils.text_cleaner import clean_text, extract_plain_text_for_embedding
from app.chains.resume_chain import parse_resume
from app.services.skill_extractor import skill_extractor

class ResumeParserService:
    """Service for parsing resumes from various inputs"""
    
    async def parse_from_file(self, file_path: str | Path) -> Optional[Dict[str, Any]]:
        """Parse resume from file path"""
        try:
            logger.info(f"Parsing resume from file: {file_path}")
            
            # Extract text from PDF or DOCX
            file_path = Path(file_path)
            if file_path.suffix.lower() == '.docx':
                raw_text = extract_text_from_docx(file_path)
                file_type_str = "DOCX"
            else:
                raw_text = extract_text_from_pdf(file_path)
                file_type_str = "PDF"
                
            if not raw_text:
                logger.error(f"Failed to extract text from {file_type_str}")
                return None
            
            # Clean text
            cleaned_text = clean_text(raw_text)
            
            # Parse with AI
            parsed_data = await parse_resume(cleaned_text)
            if not parsed_data:
                logger.error("AI parsing failed")
                return None
            
            # Ensure skills are extracted
            if not parsed_data.get("skills"):
                skills = await skill_extractor.extract_skills(cleaned_text)
                parsed_data["skills"] = skills
            
            # Add raw text for embedding
            parsed_data["raw_text"] = extract_plain_text_for_embedding(cleaned_text)
            
            logger.info(f"Successfully parsed resume for: {parsed_data.get('name', 'Unknown')}")
            return parsed_data
            
        except Exception as e:
            logger.error(f"Error parsing resume from file: {e}")
            return None
    
    async def parse_from_bytes(self, file_bytes: bytes, filename: str = "resume.pdf") -> Optional[Dict[str, Any]]:
        """Parse resume from bytes (direct upload)"""
        try:
            logger.info(f"Parsing resume from bytes: {filename}")
            
            # Extract text from PDF or DOCX bytes
            if filename.lower().endswith('.docx'):
                raw_text = extract_text_from_docx_bytes(file_bytes)
                file_type_str = "DOCX"
            else:
                raw_text = extract_text_from_pdf_bytes(file_bytes)
                file_type_str = "PDF"
                
            if not raw_text:
                logger.error(f"Failed to extract text from {file_type_str} bytes")
                return None
            
            # Clean text
            cleaned_text = clean_text(raw_text)
            
            # Parse with AI
            parsed_data = await parse_resume(cleaned_text)
            if not parsed_data:
                logger.error("AI parsing failed")
                return None
            
            # Ensure skills are extracted
            if not parsed_data.get("skills"):
                skills = await skill_extractor.extract_skills(cleaned_text)
                parsed_data["skills"] = skills
            
            # Add raw text for embedding
            parsed_data["raw_text"] = extract_plain_text_for_embedding(cleaned_text)
            
            logger.info(f"Successfully parsed resume from bytes for: {parsed_data.get('name', 'Unknown')}")
            return parsed_data
            
        except Exception as e:
            logger.error(f"Error parsing resume from bytes: {e}")
            return None

# Global instance
resume_parser_service = ResumeParserService()