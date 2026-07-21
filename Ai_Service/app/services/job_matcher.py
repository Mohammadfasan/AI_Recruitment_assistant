"""
Job Matcher Service
Orchestrates job-candidate matching using AI
"""

from typing import Dict, Any, Optional, List
from loguru import logger

from app.chains.matching_chain import match_candidate_to_job
from app.services.embedding_service import embedding_service

class JobMatcherService:
    """Service for matching candidates to job descriptions"""
    
    async def match_single(self, job_description: str, candidate_text: str) -> Optional[Dict[str, Any]]:
        """Match a single candidate to a job"""
        try:
            logger.info("Performing single candidate-job matching")
            
            result = await match_candidate_to_job(job_description, candidate_text)
            
            if result:
                logger.info(f"Match score: {result.get('match_score', 0)}")
            else:
                logger.warning("Matching returned no result")
            
            return result
            
        except Exception as e:
            logger.error(f"Error in single matching: {e}")
            return None
    
    async def match_batch(self, job_description: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Match multiple candidates to a job"""
        results = []
        
        for candidate in candidates:
            result = await self.match_single(
                job_description,
                candidate.get("text", "")
            )
            
            if result:
                result["candidate_id"] = candidate.get("id")
                results.append(result)
        
        # Sort by match score
        results.sort(key=lambda x: x.get("match_score", 0), reverse=True)
        
        logger.info(f"Batch matching completed: {len(results)} results")
        return results
    
    async def match_with_vector_search(self, job_description: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """First search similar candidates, then match"""
        try:
            # Search similar candidates
            similar = await embedding_service.search_similar_candidates(job_description, top_k)
            
            if not similar:
                logger.warning("No similar candidates found")
                return []
            
            # For each similar candidate, we need their full text
            # This would require retrieving full resume text from database
            # For now, return similarity scores
            return similar
            
        except Exception as e:
            logger.error(f"Error in vector-based matching: {e}")
            return []

# Global instance
job_matcher_service = JobMatcherService()