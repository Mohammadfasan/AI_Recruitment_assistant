"""
Similarity Calculation Utilities
Computes cosine similarity between vectors
"""

import numpy as np
from typing import List, Tuple
from loguru import logger

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Calculate cosine similarity between two vectors
    
    Args:
        vec1: First vector
        vec2: Second vector
        
    Returns:
        Cosine similarity score between 0 and 1
    """
    try:
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        
        # Calculate dot product
        dot_product = np.dot(v1, v2)
        
        # Calculate magnitudes
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        
        # Avoid division by zero
        if norm1 == 0 or norm2 == 0:
            logger.warning("Zero vector encountered in similarity calculation")
            return 0.0
        
        similarity = dot_product / (norm1 * norm2)
        
        # Ensure result is in [0, 1] (cosine similarity can be negative)
        return max(0.0, float(similarity))
        
    except Exception as e:
        logger.error(f"Error calculating cosine similarity: {e}")
        return 0.0

def batch_cosine_similarity(query_vec: List[float], candidate_vectors: List[List[float]]) -> List[float]:
    """
    Calculate cosine similarity between a query vector and multiple candidates
    
    Args:
        query_vec: Query vector
        candidate_vectors: List of candidate vectors
        
    Returns:
        List of similarity scores
    """
    try:
        query = np.array(query_vec).reshape(1, -1)
        candidates = np.array(candidate_vectors)
        
        # Normalize vectors
        query_norm = query / np.linalg.norm(query, axis=1, keepdims=True)
        candidates_norm = candidates / np.linalg.norm(candidates, axis=1, keepdims=True)
        
        # Calculate cosine similarity
        similarities = np.dot(query_norm, candidates_norm.T)[0]
        
        # Ensure non-negative
        similarities = np.maximum(similarities, 0)
        
        return similarities.tolist()
        
    except Exception as e:
        logger.error(f"Error calculating batch cosine similarity: {e}")
        return [0.0] * len(candidate_vectors)

def normalize_vector(vec: List[float]) -> List[float]:
    """Normalize a vector to unit length"""
    try:
        v = np.array(vec)
        norm = np.linalg.norm(v)
        if norm == 0:
            return vec
        normalized = v / norm
        return normalized.tolist()
    except Exception as e:
        logger.error(f"Error normalizing vector: {e}")
        return vec