"""
LangChain for Job-Candidate Matching
Uses Gemini to evaluate candidate fit for a job
"""

import json
from typing import Dict, Any, Optional
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from loguru import logger

from app.core.gemini import get_llm
from app.prompts.matching_prompt import MATCHING_PROMPT

class JobMatchingChain:
    """Chain for matching candidates to job descriptions"""
    
    def __init__(self):
        self.llm = get_llm()
        self.prompt = PromptTemplate(
            template=MATCHING_PROMPT,
            input_variables=["job_description", "candidate_text"]
        )
        self.chain = self.prompt | self.llm | StrOutputParser()
    
    async def match(self, job_description: str, candidate_text: str) -> Optional[Dict[str, Any]]:
        """
        Match a candidate to a job description
        
        Args:
            job_description: Job description text
            candidate_text: Candidate resume text
            
        Returns:
            Match results with score, skills, reasoning
        """
        try:
            logger.info("Matching candidate to job description")
            
            # Truncate if needed
            if len(job_description) > 5000:
                job_description = job_description[:5000]
            if len(candidate_text) > 4000:
                candidate_text = candidate_text[:4000]
            
            # Invoke chain
            response = await self.chain.ainvoke({
                "job_description": job_description,
                "candidate_text": candidate_text
            })
            
            # Clean response
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
            
            # Parse JSON
            match_result = json.loads(response)
            
            # Ensure score is within bounds
            match_result["match_score"] = min(100, max(0, match_result.get("match_score", 0)))
            
            logger.info(f"Match score: {match_result['match_score']}")
            return match_result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from matching response: {e}")
            return None
        except Exception as e:
            logger.error(f"Error in matching chain: {e}")
            return None

# Global instance
job_matching_chain = JobMatchingChain()

async def match_candidate_to_job(job_description: str, candidate_text: str) -> Optional[Dict[str, Any]]:
    """Convenience function to match a candidate to a job"""
    return await job_matching_chain.match(job_description, candidate_text)