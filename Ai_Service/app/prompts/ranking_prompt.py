"""
Prompt Template for Candidate Ranking
Ranks multiple candidates for a specific job
"""

RANKING_PROMPT = """
You are an expert recruitment AI. Rank the following candidates for the given job position.

JOB DESCRIPTION:
{job_description}

CANDIDATES:
{candidates_list}

For each candidate, evaluate:
1. Technical skills match
2. Relevant experience
3. Cultural fit indicators
4. Overall potential

Provide a ranked list in order of best fit to worst fit.

Return ONLY valid JSON in this format:
{{
    "rankings": [
        {{
            "candidate_id": "candidate_1",
            "rank": 1,
            "score": 92,
            "strengths": ["Key strengths"],
            "weaknesses": ["Potential gaps"],
            "recommendation": "Short recommendation"
        }}
    ]
}}

Be objective and provide detailed reasoning for rankings.
"""

def get_ranking_prompt(job_description: str, candidates: list) -> str:
    """Generate ranking prompt with candidates"""
    
    candidates_text = ""
    for idx, candidate in enumerate(candidates, 1):
        candidates_text += f"""
Candidate {idx} (ID: {candidate.get('id', f'candidate_{idx}')}):
{candidate.get('text', '')[:1500]}

"""
    
    return RANKING_PROMPT.format(
        job_description=job_description[:4000],
        candidates_list=candidates_text
    )