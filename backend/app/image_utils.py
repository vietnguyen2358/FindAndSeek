import base64
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY", "")

def encode_image_to_base64(image_bytes: bytes) -> str:
    """
    Encodes image bytes to base64 string.
    """
    return base64.b64encode(image_bytes).decode("utf-8")

def analyze_image_with_openai(image_base64: str) -> Dict[str, Any]:
    """
    Analyze an image using OpenAI's GPT-4 Vision model to extract person details.
    """
    if not openai.api_key:
        raise ValueError("OpenAI API key is not set.")
    
    # Format the image for the OpenAI API
    if "base64," not in image_base64:
        image_data = f"data:image/jpeg;base64,{image_base64}"
    else:
        image_data = image_base64
    
    try:
        # Prepare the prompt for person analysis
        prompt = """
        Analyze the person in this image and extract the following details:
        1. Gender (Male/Female/Unknown)
        2. Approximate age range
        3. Clothing description (upper body, lower body, footwear)
        4. Ethnicity (if apparent)
        5. Any distinguishing features (glasses, hat, backpack, etc.)
        6. Current location context (if visible in the image)
        
        Format your response as a structured JSON object with the following fields:
        {
            "gender": "Male/Female/Unknown",
            "age_estimate": "age range (e.g., 20-30)",
            "clothing": {
                "upper": "description including color",
                "lower": "description including color",
                "footwear": "description including color"
            },
            "ethnicity": "ethnicity if apparent, otherwise 'Unknown'",
            "distinguishing_features": ["feature1", "feature2"],
            "location": "location context if visible",
            "confidence_score": 0.0-1.0
        }
        
        Provide only the JSON object, nothing else.
        """
        
        # Make the API call to GPT-4 Vision
        response = openai.ChatCompletion.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_data}}
                    ]
                }
            ],
            max_tokens=1000
        )
        
        # Parse the response
        result_text = response['choices'][0]['message']['content']
        
        # Try to extract JSON from the response
        if "```json" in result_text:
            json_str = result_text.split("```json")[1].split("```")[0].strip()
            result = json.loads(json_str)
        elif "```" in result_text:
            json_str = result_text.split("```")[1].split("```")[0].strip()
            result = json.loads(json_str)
        else:
            # Try to parse the text directly
            result = json.loads(result_text)
        
        return result
        
    except Exception as e:
        # Log the error
        print(f"Error calling OpenAI API: {str(e)}")
        # Raise the exception to be handled by the caller
        raise 