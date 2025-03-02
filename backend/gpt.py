import cv2
import numpy as np
import time
from typing import Dict, List, Optional
from constants import OPENAI_API_KEY, GROQ_API_KEY

# We'll implement a mock/simplified version for now to get the server running
# Real GPT implementation can be added later

def get_person_description(person_data: Dict, person_image: np.ndarray) -> Dict:
    """
    Mock implementation that returns placeholder data instead of using GPT.
    
    Args:
        person_data: Dictionary with person detection data
        person_image: Cropped image of the detected person
        
    Returns:
        Dictionary with mock person description
    """
    # Check if we have a valid image
    has_valid_image = person_image is not None and person_image.size > 0
    
    # Generate basic info based on confidence score
    confidence = person_data.get("confidence_score", 0.0)
    
    if has_valid_image:
        # Generate placeholder values based on image properties
        avg_color = np.mean(person_image, axis=(0, 1)) if person_image.ndim == 3 else [0, 0, 0]
        is_dark_clothing = np.mean(avg_color) < 128
        
        # Create mock description
        return {
            "gender": "Male" if confidence > 0.6 else "Female" if confidence > 0.4 else "Unknown",
            "age_estimate": "Adult",
            "clothing": {
                "upper": "Dark shirt" if is_dark_clothing else "Light shirt",
                "lower": "Dark pants" if is_dark_clothing else "Light pants",
                "footwear": "Shoes"
            },
            "distinguishing_features": ["Detected with confidence: {:.2f}".format(confidence)]
        }
    else:
        # Return default values for invalid images
        return {
            "gender": "Unknown",
            "age_estimate": "Unknown",
            "clothing": {
                "upper": "Unknown",
                "lower": "Unknown",
                "footwear": "Unknown"
            },
            "distinguishing_features": []
        }

# Add for future implementation
def analyze_person_with_groq(person_data: Dict, person_image: np.ndarray) -> Dict:
    """Fallback to Groq API if OpenAI is unavailable"""
    # Return the same mock data for now
    return get_person_description(person_data, person_image)