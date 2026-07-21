"""
Candidate Ranker Service
Ranks candidates for a specific job position
"""

from typing import List, Dict, Any, Optional
from loguru import logger

from app.chains.ranking_chain import candidate_ranking_chain

class CandidateRankerService:
    """Service for ranking candidates"""
    
    async def rank_candidates(self, job_description: str, candidates: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        """
        Rank candidates for a job
        
        Args:
            job_description: Job description text
            candidates: List of candidates with 'id' and 'text'
            
        Returns:
            Ranked list of candidates with scores and recommendations
        """
        try:
            logger.info(f"Ranking {len(candidates)} candidates")
            
            if not candidates:
                logger.warning("No candidates to rank")
                return []
            
            # Truncate candidate texts if needed
            for candidate in candidates:
                if len(candidate.get("text", "")) > 3000:
                    candidate["text"] = candidate["text"][:3000]
            
            # Get rankings from AI
            rankings = await candidate_ranking_chain.rank(job_description, candidates)
            
            if rankings:
                logger.info(f"Successfully ranked {len(rankings)} candidates")
            else:
                logger.warning("Ranking returned no results")
            
            return rankings
            
        except Exception as e:
            logger.error(f"Error ranking candidates: {e}")
            return None
    
    def get_top_candidates(self, rankings: List[Dict[str, Any]], top_n: int = 5) -> List[Dict[str, Any]]:
        """Get top N ranked candidates"""
        if not rankings:
            return []
        
        return rankings[:top_n]
    
    def filter_by_score(self, rankings: List[Dict[str, Any]], min_score: float = 70) -> List[Dict[str, Any]]:
        """Filter candidates by minimum score"""
        if not rankings:
            return []
        
        return [r for r in rankings if r.get("score", 0) >= min_score]

# Global instance
candidate_ranker_service = CandidateRankerService()