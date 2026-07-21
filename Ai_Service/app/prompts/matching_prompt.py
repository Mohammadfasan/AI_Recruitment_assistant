"""
Prompt Template for Job Matching
Evaluates fit between candidate and job description
"""

MATCHING_PROMPT = """
You are an expert recruitment AI. Analyze how well the candidate matches the job requirements.

JOB DESCRIPTION:
{job_description}

CANDIDATE PROFILE:
{candidate_text}

Based on the information above, provide:

1. match_score: A percentage score (0-100) indicating overall fit (same as match_percentage)
2. match_percentage: A percentage score (0-100) indicating overall fit
3. matched_skills: List of skills from candidate that match job requirements (array of strings)
4. missing_skills: List of required skills that candidate lacks (array of strings)
5. reasoning: A short 2-3 sentence summary of the matching logic
6. compare_skills: A detailed comparison of the candidate's skills vs. job's required skills
7. compare_experience: A detailed comparison of candidate's work experience vs. job's experience requirements
8. compare_education: A detailed comparison of candidate's education history vs. job's education requirements
9. compare_certifications: A detailed comparison of candidate's certifications vs. job's certification requirements
10. match_explanation: A comprehensive breakdown of the strengths, weaknesses, and potential gaps identified
11. recommendation: Final recommendation: "Shortlist", "Reject", or "Manual Review"

Be objective and fair. Return ONLY valid JSON in this format:
{{
    "match_score": 85,
    "match_percentage": 85,
    "matched_skills": ["Python", "SQL", "Machine Learning"],
    "missing_skills": ["Docker", "Kubernetes"],
    "reasoning": "Candidate has strong Python and ML experience but missing DevOps skills.",
    "compare_skills": "Candidate matches 80% of skills, strong in Python/SQL but lacks Docker/Kubernetes.",
    "compare_experience": "Job requires 3 years, candidate has 4 years of relevant ML experience.",
    "compare_education": "Job requires CS Degree, candidate has MS in Data Science.",
    "compare_certifications": "No specific certifications required, candidate holds AWS Cloud Practitioner.",
    "match_explanation": "The candidate has very strong programming and analytical skills that align with the position. Gaps in DevOps toolchains can be trained.",
    "recommendation": "Shortlist"
}}
"""

def get_matching_prompt(job_description: str, candidate_text: str) -> str:
    """Generate the matching prompt"""
    # Truncate long texts
    job_desc = job_description[:4000]
    candidate = candidate_text[:3000]
    
    return MATCHING_PROMPT.format(
        job_description=job_desc,
        candidate_text=candidate
    )