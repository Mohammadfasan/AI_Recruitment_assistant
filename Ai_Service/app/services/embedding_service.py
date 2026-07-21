"""
Embedding Service
Generates embeddings and manages vector storage
"""

from typing import List, Dict, Any, Optional
from loguru import logger
import uuid

from app.core.gemini import get_embeddings
from app.core.chroma import get_collection
from app.utils.similarity import cosine_similarity

class EmbeddingService:
    """Service for generating and storing embeddings"""
    
    def __init__(self):
        self.embeddings = get_embeddings()
        self.collection = get_collection()
    
    async def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding for text using Gemini"""
        try:
            if not text or len(text.strip()) < 10:
                logger.warning("Text too short for embedding generation")
                return None
            
            embedding = await self.embeddings.aembed_query(text)
            logger.info(f"Generated embedding of dimension {len(embedding)}")
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return None
    
    async def save_resume_embedding(self, resume_id: str, resume_text: str, metadata: Dict[str, Any]) -> Optional[str]:
        """Save resume embedding to ChromaDB"""
        try:
            embedding = await self.generate_embedding(resume_text)
            if not embedding:
                return None
            
            # Generate unique ID for vector
            vector_id = f"resume_{resume_id}_{uuid.uuid4().hex[:8]}"
            
            # Add to ChromaDB
            self.collection.add(
                ids=[vector_id],
                embeddings=[embedding],
                metadatas=[metadata],
                documents=[resume_text[:1000]]  # Store preview
            )
            
            logger.info(f"Saved resume embedding with ID: {vector_id}")
            return vector_id
            
        except Exception as e:
            logger.error(f"Error saving resume embedding: {e}")
            return None
    
    async def search_similar_candidates(self, query_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar candidates using vector similarity"""
        try:
            query_embedding = await self.generate_embedding(query_text)
            if not query_embedding:
                return []
            
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                include=["metadatas", "documents", "distances"]
            )
            
            # Format results
            similar_candidates = []
            if results['ids'] and results['ids'][0]:
                for i, doc_id in enumerate(results['ids'][0]):
                    similar_candidates.append({
                        "id": doc_id,
                        "similarity_score": 1 - results['distances'][0][i],  # Convert distance to similarity
                        "metadata": results['metadatas'][0][i] if results['metadatas'] else {},
                        "preview": results['documents'][0][i] if results['documents'] else ""
                    })
            
            logger.info(f"Found {len(similar_candidates)} similar candidates")
            return similar_candidates
            
        except Exception as e:
            logger.error(f"Error searching similar candidates: {e}")
            return []
    
    async def delete_embedding(self, vector_id: str) -> bool:
        """Delete embedding from ChromaDB"""
        try:
            self.collection.delete(ids=[vector_id])
            logger.info(f"Deleted embedding: {vector_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting embedding: {e}")
            return False

# Global instance
embedding_service = EmbeddingService()