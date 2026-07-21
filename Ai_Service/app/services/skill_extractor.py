"""
Skill Extraction Service
Identifies technical and soft skills from resume text
"""

import re
from typing import List, Set
from loguru import logger

# Common technical skills database (fallback if AI fails)
COMMON_SKILLS = {
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin",
    # Frameworks
    "react", "angular", "vue", "django", "flask", "spring", "express", "fastapi", "rails", "laravel",
    # Databases
    "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb",
    # Cloud
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "gitlab", "github actions",
    # Data Science
    "machine learning", "deep learning", "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn",
    "data analysis", "statistics", "nlp", "computer vision",
    # Soft Skills
    "leadership", "communication", "teamwork", "problem solving", "critical thinking", "project management",
    "agile", "scrum", "time management", "adaptability", "creativity"
}

class SkillExtractor:
    """Extract skills from text using pattern matching and AI"""
    
    def __init__(self):
        self.common_skills = COMMON_SKILLS
    
    def extract_skills_pattern_based(self, text: str) -> List[str]:
        """Extract skills using pattern matching (fallback)"""
        text_lower = text.lower()
        found_skills = set()
        
        for skill in self.common_skills:
            # Check for whole word match or phrase match
            if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
                found_skills.add(skill)
            # Also check for hyphenated versions
            elif '-' in skill and re.search(r'\b' + re.escape(skill.replace('-', ' ')) + r'\b', text_lower):
                found_skills.add(skill)
        
        return sorted(list(found_skills))
    
    async def extract_skills_ai(self, text: str) -> List[str]:
        """Extract skills using Gemini AI"""
        from app.core.gemini import get_llm
        
        try:
            llm = get_llm()
            prompt = f"""
            Extract all technical and professional skills from the following text.
            Return ONLY a JSON array of skill names, nothing else.
            
            Text: {text[:2000]}
            
            Example output: ["Python", "Machine Learning", "Project Management"]
            """
            
            response = await llm.ainvoke(prompt)
            skills_text = response.content.strip()
            
            # Parse the response
            import json
            # Clean markdown
            if skills_text.startswith("```json"):
                skills_text = skills_text[7:]
            if skills_text.startswith("```"):
                skills_text = skills_text[3:]
            if skills_text.endswith("```"):
                skills_text = skills_text[:-3]
            
            skills = json.loads(skills_text)
            return skills if isinstance(skills, list) else []
            
        except Exception as e:
            logger.error(f"AI skill extraction failed: {e}")
            return self.extract_skills_pattern_based(text)
    
    async def extract_skills(self, text: str, use_ai: bool = True) -> List[str]:
        """Main method to extract skills"""
        if use_ai:
            skills = await self.extract_skills_ai(text)
            if skills:
                return skills
        
        # Fallback to pattern matching
        return self.extract_skills_pattern_based(text)

# Global instance
skill_extractor = SkillExtractor()