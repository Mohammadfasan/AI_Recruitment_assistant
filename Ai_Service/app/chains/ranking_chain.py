"""
LangChain for Candidate Ranking
Uses Gemini to rank multiple candidates for a job
"""

import json
from typing import Dict, Any, List, Optional
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from loguru import logger

from app.core.gemini import get_llm
from app.prompts.ranking_prompt import RANKING_PROMPT

class CandidateRankingChain:
    """Chain for ranking multiple candidates"""
    
    def __init__(self):
        self.llm = get_llm()
        self.prompt = PromptTemplate(
            template=RANKING_PROMPT,
            input_variables=["job_description", "candidates_list"]
        )
        self.chain = self.prompt | self.llm | StrOutputParser()
    
    async def rank(self, job_description: str, candidates: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        """
        Rank candidates for a job
        
        Args:
            job_description: Job description text
            candidates: List of candidate dicts with 'id' and 'text'
            
        Returns:
            Ranked list of candidates with scores
        """
        try:
            logger.info(f"Ranking {len(candidates)} candidates for job")
            
            # Truncate job description
            if len(job_description) > 5000:
                job_description = job_description[:5000]
            
            # Build candidates list text
            candidates_text = ""
            for idx, candidate in enumerate(candidates, 1):
                candidate_text = candidate.get('text', '')[:1500]
                candidates_text += f"""
Candidate {idx} (ID: {candidate.get('id', f'candidate_{idx}')}):
{candidate_text}

"""
            
            # Invoke chain
            response = await self.chain.ainvoke({
                "job_description": job_description,
                "candidates_list": candidates_text
            })
            
            # Clean and parse
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
            
            result = json.loads(response)
            rankings = result.get("rankings", [])
            
            logger.info(f"Successfully ranked {len(rankings)} candidates")
            return rankings
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from ranking response: {e}")
            return None
        except Exception as e:
            logger.error(f"Error in ranking chain: {e}")
            return None

# Global instance
candidate_ranking_chain = CandidateRankingChain()