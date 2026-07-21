"""
Interview Generator Service
Generates structured interview questions from job descriptions
"""

from typing import Dict, Any, Optional
from loguru import logger

from app.chains.interview_chain import generate_interview_questions

class InterviewGeneratorService:
    """Service for generating interview questions"""
    
    async def generate_questions(self, job_title: str, required_skills: str, candidate_resume: str) -> Optional[Dict[str, Any]]:
        """
        Generate interview questions based on job requirements and candidate resume
        
        Returns:
            Dictionary with technical, behavioral, scenario, and coding questions
        """
        try:
            logger.info(f"Generating interview questions for {job_title}")
            
            if not job_title:
                logger.warning("Job title is empty for question generation")
                return None
            
            questions = await generate_interview_questions(job_title, required_skills, candidate_resume)
            
            if questions:
                tech_count = len(questions.get("technical_questions", []))
                beh_count = len(questions.get("behavioral_questions", []))
                adv_count = len(questions.get("advanced_questions", []))
                
                logger.info(f"Generated {tech_count} technical, {beh_count} behavioral, {adv_count} advanced questions")
            else:
                logger.warning("Question generation returned no results")
            
            return questions
            
        except Exception as e:
            logger.error(f"Error generating interview questions: {e}")
            return None
    
    def format_questions_for_display(self, questions: Dict[str, Any]) -> str:
        """Format questions as readable text for display"""
        if not questions:
            return "No questions generated."
        
        output = []
        
        # Technical questions
        output.append("## Technical Questions\n")
        for i, q in enumerate(questions.get("technical_questions", []), 1):
            output.append(f"{i}. {q.get('question', 'N/A')}")
            output.append(f"   *Tests: {q.get('tests', 'N/A')}*")
            output.append(f"   *Expected: {', '.join(q.get('expected_key_points', []))}*\n")
        
        # Behavioral questions
        output.append("\n## Behavioral Questions\n")
        for i, q in enumerate(questions.get("behavioral_questions", []), 1):
            output.append(f"{i}. {q.get('question', 'N/A')}")
            output.append(f"   *Tests: {q.get('tests', 'N/A')}*\n")
        
        # Advanced questions
        output.append("\n## Advanced Questions\n")
        for i, q in enumerate(questions.get("advanced_questions", []), 1):
            output.append(f"{i}. {q.get('question', 'N/A')}")
            output.append(f"   *Tests: {q.get('tests', 'N/A')}*\n")
        
        return "\n".join(output)

# Global instance
interview_generator_service = InterviewGeneratorService()