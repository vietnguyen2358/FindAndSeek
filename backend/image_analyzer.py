import base64
import cv2
import numpy as np
import os
import json
from openai import OpenAI
from fastapi import UploadFile, HTTPException
from typing import Dict, List, Any, Optional, Union
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable is missing.")

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

# Helper function to encode an image to base64
def encode_image(image_bytes):
    return base64.b64encode(image_bytes).decode('utf-8')

# Crop image into quadrants
def crop_image(image_bytes):
    try:
        img_np = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(img_np, cv2.IMREAD_COLOR)
        height, width = img.shape[:2]
        
        return [
            img[0:height//2, 0:width//2],  # Top-left
            img[0:height//2, width//2:width],  # Top-right
            img[height//2:height, 0:width//2],  # Bottom-left
            img[height//2:height, width//2:width]  # Bottom-right
        ]
    except Exception as e:
        return [image_bytes]

async def analyze_image(file: UploadFile) -> Dict[str, Any]:
    """
    Analyze an image using OpenAI's vision model to detect people and their characteristics.
    
    Args:
        file: The uploaded image file
        
    Returns:
        A dictionary containing the analysis results
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        image_bytes = await file.read()
        cropped_images = crop_image(image_bytes)
        base64_images = [encode_image(cv2.imencode('.jpg', img)[1].tobytes()) for img in cropped_images]
        
        prompt = """
        You are an AI vision assistant helping in Search and Rescue and Amber Alert cases.

You will analyze multiple detected persons from an image and provide a structured JSON description for each person.

For each detected person, return a JSON array where each item contains:
- `person_id`: A unique identifier (e.g., "person1").
- `gender`: Estimated gender or "Unknown".
- `age_estimate`: Approximate age range.
- `clothing`: A dictionary containing:
  - `upper`: Shirt, hoodie, jacket, etc. (Include color)
  - `lower`: Pants, jeans, skirt, shorts, etc. (Include color)
  - `footwear`: Shoes, boots, sandals, etc. (Include color)
- `distinguishing_features`: List of unique features (e.g., glasses, hat, backpack, scars, tattoos, hair color, accessories).

If no persons are detected in the image, return an empty array [].

IMPORTANT: Return ONLY the JSON array without any other text, explanation, or code block wrappers.
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": [{"type": "text", "text": prompt}] + 
                 [{"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img}"}} for img in base64_images]
                }
            ]
        )

        # Extract the response content
        content = response.choices[0].message.content.strip()
        
        # Clean up the response to ensure it's valid JSON
        # Remove markdown code block indicators if present
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        
        content = content.strip()
        
        # If the response looks empty or indicates no people, return an empty array
        if not content or content.lower() in ["[]", "none", "no people detected", "no persons detected"]:
            return {"status": "success", "message": "No persons detected in the image", "data": []}
            
        try:
            # Try to parse as JSON
            parsed_data = json.loads(content)
            return {"status": "success", "message": "Analysis completed", "data": parsed_data}
        except json.JSONDecodeError:
            # If JSON parsing fails, return the raw content for debugging
            return {
                "status": "warning", 
                "message": "Response could not be parsed as JSON. Returning raw content.", 
                "raw_content": content
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")
