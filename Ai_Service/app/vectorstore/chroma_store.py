"""
ChromaDB Vector Store Management
High-level interface for vector operations
"""

from typing import List, Dict, Any, Optional
from loguru import logger

from app.core.chroma import get_collection
from app.services.embedding_service import embedding_service

class ChromaStore:
    """High-level ChromaDB operations"""
    
    def __init__(self):
        self.collection = get_collection()
        self.embedding_service = embedding_service
    
    async def add_resume(self, resume_id: str, text: str, metadata: Dict[str, Any]) -> Optional[str]:
        """Add resume to vector store"""
        return await self.embedding_service.save_resume_embedding(resume_id, text, metadata)
    
    async def search_similar(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        return await self.embedding_service.search_similar_candidates(query, top_k)
    
    async def delete_resume(self, vector_id: str) -> bool:
        """Delete resume from vector store"""
        return await self.embedding_service.delete_embedding(vector_id)
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the collection"""
        try:
            count = self.collection.count()
            return {
                "collection_name": self.collection.name,
                "document_count": count,
                "is_persistent": True
            }
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {}
    
    async def clear_collection(self) -> bool:
        """Clear all documents from collection (use with caution)"""
        try:
            # Get all IDs and delete
            results = self.collection.get()
            if results['ids']:
                self.collection.delete(ids=results['ids'])
                logger.warning(f"Cleared {len(results['ids'])} documents from collection")
            return True
        except Exception as e:
            logger.error(f"Error clearing collection: {e}")
            return False

# Global instance
chroma_store = ChromaStore()