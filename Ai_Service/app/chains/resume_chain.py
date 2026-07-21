"""
LangChain for Resume Parsing
Uses Gemini to extract structured information from resumes
"""

import json
from typing import Dict, Any, Optional
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from loguru import logger

from app.core.gemini import get_llm
from app.prompts.resume_prompt import RESUME_PARSING_PROMPT

class ResumeParsingChain:
    """Chain for parsing resumes into structured data"""
    
    def __init__(self):
        self.llm = get_llm()
        self.prompt = PromptTemplate(
            template=RESUME_PARSING_PROMPT,
            input_variables=["resume_text"]
        )
        self.chain = self.prompt | self.llm | StrOutputParser()
    
    async def parse(self, resume_text: str) -> Optional[Dict[str, Any]]:
        """
        Parse resume text into structured JSON
        
        Args:
            resume_text: Extracted text from resume PDF
            
        Returns:
            Parsed resume data as dictionary
        """
        try:
            logger.info(f"Parsing resume of length: {len(resume_text)}")
            
            # Truncate if too long
            if len(resume_text) > 8000:
                resume_text = resume_text[:8000]
                logger.warning("Resume text truncated to 8000 characters")
            
            # Invoke the chain
            response = await self.chain.ainvoke({"resume_text": resume_text})
            
            # Clean response (remove markdown code blocks if present)
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
            
            # Parse JSON
            parsed_data = json.loads(response)
            logger.info(f"Successfully parsed resume: {parsed_data.get('name', 'Unknown')}")
            
            return parsed_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from LLM response: {e}")
            logger.debug(f"Raw response: {response}")
            return None
        except Exception as e:
            logger.error(f"Error in resume parsing chain: {e}")
            return None

# Global instance
resume_parsing_chain = ResumeParsingChain()

async def parse_resume(resume_text: str) -> Optional[Dict[str, Any]]:
    """Convenience function to parse a resume"""
    return await resume_parsing_chain.parse(resume_text)