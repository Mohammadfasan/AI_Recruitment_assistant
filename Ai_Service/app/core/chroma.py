"""
ChromaDB Vector Database Initialization
Manages persistent storage for embeddings
"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from loguru import logger
from app.core.settings import settings

class ChromaClient:
    """Singleton wrapper for ChromaDB client"""
    
    _instance = None
    _client = None
    _collection = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @property
    def client(self):
        """Get ChromaDB persistent client"""
        if self._client is None:
            try:
                # Ensure the directory exists
                settings.chroma_db_path.mkdir(parents=True, exist_ok=True)
                
                self._client = chromadb.PersistentClient(
                    path=str(settings.chroma_db_path),
                    settings=ChromaSettings(
                        anonymized_telemetry=False,
                        allow_reset=True
                    )
                )
                logger.info(f"ChromaDB client initialized at {settings.chroma_db_path}")
            except Exception as e:
                logger.error(f"Failed to initialize ChromaDB: {e}")
                raise
        return self._client
    
    @property
    def collection(self):
        """Get or create the main collection"""
        if self._collection is None:
            try:
                # Try to get existing collection
                collections = self.client.list_collections()
                collection_names = [c.name for c in collections]
                
                if settings.chroma_collection_name in collection_names:
                    self._collection = self.client.get_collection(
                        name=settings.chroma_collection_name
                    )
                    logger.info(f"Loaded existing collection: {settings.chroma_collection_name}")
                else:
                    self._collection = self.client.create_collection(
                        name=settings.chroma_collection_name,
                        metadata={"hnsw:space": "cosine"}  # Cosine similarity
                    )
                    logger.info(f"Created new collection: {settings.chroma_collection_name}")
            except Exception as e:
                logger.error(f"Failed to get/create collection: {e}")
                raise
        return self._collection

# Global instance
chroma_client = ChromaClient()

def get_chroma_client():
    """Get ChromaDB client"""
    return chroma_client.client

def get_collection():
    """Get ChromaDB collection"""
    return chroma_client.collection