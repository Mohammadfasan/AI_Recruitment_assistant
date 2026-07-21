"""
Text Cleaning Utilities
Normalizes and cleans extracted text from resumes
"""

import re
from typing import Optional

def clean_text(text: str) -> str:
    """
    Clean and normalize extracted text
    
    Args:
        text: Raw extracted text
        
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters that aren't useful
    text = re.sub(r'[^\w\s\@\.\,\-\+\#\/]', '', text)
    
    # Remove multiple spaces
    text = re.sub(r' +', ' ', text)
    
    # Remove leading/trailing whitespace
    text = text.strip()
    
    return text

def normalize_whitespace(text: str) -> str:
    """Normalize all whitespace to single spaces"""
    if not text:
        return ""
    return ' '.join(text.split())

def remove_email_addresses(text: str) -> str:
    """Remove email addresses from text (for privacy)"""
    if not text:
        return ""
    return re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)

def remove_phone_numbers(text: str) -> str:
    """Remove phone numbers from text (for privacy)"""
    if not text:
        return ""
    # Remove US/Canada phone numbers
    return re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', text)

def extract_plain_text_for_embedding(text: str) -> str:
    """
    Prepare text for embedding - minimal cleaning
    Preserves structure but removes excessive whitespace
    """
    if not text:
        return ""
    
    # Basic cleaning only
    text = normalize_whitespace(text)
    text = ' '.join(text.split())
    
    return text[:8000]  # Truncate to 8000 chars for embedding