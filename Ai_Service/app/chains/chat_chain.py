"""
LangChain for Recruiter Chat Assistant
Uses Gemini to answer recruiter questions
"""

from typing import Optional
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from loguru import logger

from app.core.gemini import get_llm
from app.prompts.chat_prompt import CHAT_ASSISTANT_PROMPT

class RecruiterChatChain:
    """Chain for recruiter chat interactions"""
    
    def __init__(self):
        self.llm = get_llm()
        self.prompt = PromptTemplate(
            template=CHAT_ASSISTANT_PROMPT,
            input_variables=["question", "candidate_context", "job_context"]
        )
        self.chain = self.prompt | self.llm | StrOutputParser()
    
    async def chat(self, question: str, candidate_context: str = "", job_context: str = "") -> Optional[str]:
        """
        Answer recruiter's question
        
        Args:
            question: Recruiter's question
            candidate_context: Information about candidates
            job_context: Information about jobs
            
        Returns:
            AI assistant response
        """
        try:
            logger.info(f"Processing recruiter question: {question[:100]}...")
            
            # Invoke chain
            response = await self.chain.ainvoke({
                "question": question,
                "candidate_context": candidate_context or "No candidate information available.",
                "job_context": job_context or "No job information available."
            })
            
            logger.info("Successfully generated response")
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error in chat chain: {e}")
            return "I'm sorry, I encountered an error processing your question. Please try again."

# Global instance
recruiter_chat_chain = RecruiterChatChain()