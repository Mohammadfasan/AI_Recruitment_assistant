"""
LangChain for Interview Question Generation
Uses Gemini to generate structured interview questions
"""

import json
from typing import Dict, Any, Optional
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from loguru import logger

from app.core.gemini import get_llm
from app.prompts.interview_prompt import INTERVIEW_QUESTIONS_PROMPT

class InterviewQuestionChain:
    """Chain for generating interview questions from job requirements and candidate resume"""
    
    def __init__(self):
        self.llm = get_llm()
        self.prompt = PromptTemplate(
            template=INTERVIEW_QUESTIONS_PROMPT,
            input_variables=["job_title", "required_skills", "candidate_resume"]
        )
        self.chain = self.prompt | self.llm | StrOutputParser()
    
    async def generate(self, job_title: str, required_skills: str, candidate_resume: str) -> Optional[Dict[str, Any]]:
        """
        Generate interview questions based on job and candidate resume
        
        Args:
            job_title: Job title / position
            required_skills: Skills required for job
            candidate_resume: Text from candidate's resume
            
        Returns:
            Dictionary with technical, behavioral, scenario, and coding questions
        """
        try:
            logger.info(f"Generating interview questions for position: {job_title}")
            
            # Truncate if needed
            if len(candidate_resume) > 4000:
                candidate_resume = candidate_resume[:4000]
            
            # Invoke chain
            response = await self.chain.ainvoke({
                "job_title": job_title,
                "required_skills": required_skills,
                "candidate_resume": candidate_resume
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
            questions = json.loads(response)
            
            # Validate structure
            required_keys = ["technical_questions", "behavioral_questions", "scenario_questions", "coding_questions"]
            for key in required_keys:
                if key not in questions:
                    questions[key] = []
            
            logger.info(f"Generated {len(questions['technical_questions'])} technical, "
                        f"{len(questions['behavioral_questions'])} behavioral, "
                        f"{len(questions['scenario_questions'])} scenario, "
                        f"{len(questions['coding_questions'])} coding questions")
            
            return questions
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from interview generation: {e}")
            return None
        except Exception as e:
            logger.error(f"Error in interview question chain: {e}")
            return None

# Global instance
interview_question_chain = InterviewQuestionChain()

async def generate_interview_questions(job_title: str, required_skills: str, candidate_resume: str) -> Optional[Dict[str, Any]]:
    """Convenience function to generate interview questions"""
    return await interview_question_chain.generate(job_title, required_skills, candidate_resume)