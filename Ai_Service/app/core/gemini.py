"""
Gemini AI Model Initialization
Sets up LangChain integration with Google Gemini
"""

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from loguru import logger
from app.core.settings import settings

class GeminiClient:
    """Singleton wrapper for Gemini models"""
    
    _instance = None
    _llm = None
    _embeddings = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @property
    def llm(self):
        """Get ChatGoogleGenerativeAI instance"""
        if self._llm is None:
            try:
                self._llm = ChatGoogleGenerativeAI(
                    model=settings.gemini_model,
                    google_api_key=settings.gemini_api_key,
                    temperature=0.3,  # Lower temperature for consistent results
                    max_tokens=4096,
                    timeout=120,
                    max_retries=3,
                )
                logger.info(f"Gemini LLM initialized with model: {settings.gemini_model}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini LLM: {e}")
                raise
        return self._llm
    
    @property
    def embeddings(self):
        """Get GoogleGenerativeAIEmbeddings instance"""
        if self._embeddings is None:
            try:
                self._embeddings = GoogleGenerativeAIEmbeddings(
                    model=settings.embedding_model,
                    google_api_key=settings.gemini_api_key,
                )
                logger.info(f"Gemini embeddings initialized with model: {settings.embedding_model}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini embeddings: {e}")
                raise
        return self._embeddings

# Global instance
gemini_client = GeminiClient()

# Convenience functions
def get_llm():
    """Get Gemini LLM instance"""
    return gemini_client.llm

def get_embeddings():
    """Get Gemini embeddings instance"""
    return gemini_client.embeddings