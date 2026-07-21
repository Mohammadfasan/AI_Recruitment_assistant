"""
Prompt Template for Resume Parsing
Used to extract structured information from resumes
"""

RESUME_PARSING_PROMPT = """
You are an expert resume parser. Extract structured information from the following resume text.

Resume Text:
{resume_text}

Extract and return the following information in JSON format:

1. name: Full name of the candidate (string)
2. email: Email address (string, if found)
3. phone: Phone number (string, if found)
4. skills: List of technical and soft skills (array of strings)
5. education: List of education entries, each containing:
   - degree: Degree name
   - institution: School/University name
   - year: Graduation year (if available)
6. experience: List of work experiences, each containing:
   - title: Job title
   - company: Company name
   - duration: Time period (e.g., "2020-2023")
   - description: Key responsibilities (brief summary)
7. summary: A 2-3 sentence professional summary of the candidate
8. github: GitHub profile URL (string, if found)
9. linkedin: LinkedIn profile URL (string, if found)
10. resume_score: A numerical score (0-100) evaluating the quality, layout completeness, structure, and professional detail of the resume.
11. suggestions: A list of 3-5 specific, actionable suggestions for improving the resume (e.g. "Add a certifications section", "Detail quantitative achievements in work experience").
12. missing_skills: A list of technical and soft skills that are highly relevant to the candidate's career track but missing from their resume.

Important rules:
- Be thorough but accurate - only include information explicitly stated or strongly implied
- For skills, include both technical (Python, Java, React) and soft skills (Leadership, Communication)
- If a field is not found, use null for single fields or empty array for lists
- Normalize dates to YYYY format where possible
- Keep descriptions concise (max 100 words per experience)

Return ONLY valid JSON, no other text.
"""

def get_resume_parsing_prompt(resume_text: str) -> str:
    """Generate the resume parsing prompt with the resume text"""
    return RESUME_PARSING_PROMPT.format(resume_text=resume_text[:6000])  # Limit text length