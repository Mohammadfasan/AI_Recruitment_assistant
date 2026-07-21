"""
Prompt Template for Interview Question Generation
Creates structured interview questions based on job requirements
"""

INTERVIEW_QUESTIONS_PROMPT = """
You are an expert technical interviewer. Generate relevant interview questions for this job position, customized to the candidate's resume and qualifications.

JOB POSITION:
{job_title}

REQUIRED SKILLS:
{required_skills}

CANDIDATE RESUME:
{candidate_resume}

Generate questions in four categories, tailored to their level and skills:

1. TECHNICAL QUESTIONS (3-4 questions):
   - Test specific technical skills required for the role
   - Assess domain knowledge

2. BEHAVIORAL QUESTIONS (2-3 questions):
   - Teamwork, adaptability, and collaboration
   - Scenarios from their past experience

3. SCENARIO-BASED QUESTIONS (2-3 questions):
   - Complex situational problem-solving in the context of this job

4. CODING QUESTIONS (if applicable, else technical design or role-specific exercise) (1-2 questions):
   - Practical programming problem or design task related to the required skills

For each question, include:
- The question text
- What skill/quality it tests
- Expected key points in a good answer

Return ONLY valid JSON in this format:
{{
    "technical_questions": [
        {{
            "question": "Question text here?",
            "tests": "What this tests",
            "expected_key_points": ["Point 1", "Point 2"]
        }}
    ],
    "behavioral_questions": [...],
    "scenario_questions": [...],
    "coding_questions": [...]
}}
"""

def get_interview_questions_prompt(job_title: str, required_skills: str, candidate_resume: str) -> str:
    """Generate interview questions prompt"""
    return INTERVIEW_QUESTIONS_PROMPT.format(
        job_title=job_title,
        required_skills=required_skills,
        candidate_resume=candidate_resume[:4000]
    )