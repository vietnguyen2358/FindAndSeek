import base64
import json
import os
import cv2
from openai import OpenAI
from dotenv import load_dotenv
import logging
from typing import Dict, Any, Optional
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get API key from environment variable for security
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# OpenAI client setup
client = OpenAI(api_key=OPENAI_API_KEY)

def encode_image(image: cv2.Mat) -> str:
    """
    Encode an OpenCV image to base64
    
    Args:
        image: OpenCV image array
        
    Returns:
        Base64 encoded string of the image
    """
    try:
        # Ensure image is in RGB format
        if len(image.shape) == 2:  # Grayscale
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:  # RGBA
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
            
        _, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return base64.b64encode(buffer).decode("utf-8")
    except Exception as e:
        logger.error(f"Error encoding image: {str(e)}")
        raise

def describe_clothing(image: cv2.Mat) -> Dict[str, Any]:
    """
    Generate clothing description using GPT-4 Vision
    
    Args:
        image: OpenCV image array of a detected person
        
    Returns:
        Dictionary containing person description
    """
    try:
        start_time = time.time()
        logger.info("Starting GPT-4 Vision analysis")
        
        base64_image = encode_image(image)

        prompt = """
        You are an AI vision assistant helping in Search and Rescue (SAR) and Amber Alert cases.
        Analyze the detected person in the image and provide a structured JSON description.
        
        Return a JSON with EXACTLY these fields:
        {
            "gender": "Male/Female/Unknown",
            "age_estimate": "Specific age range (e.g., '20-25 years')",
            "clothing": {
                "upper": "Detailed description of upper body clothing with color",
                "lower": "Detailed description of lower body clothing with color",
                "footwear": "Detailed description of footwear with color"
            },
            "distinguishing_features": ["List of unique features"]
        }
        
        Be as specific and detailed as possible with clothing descriptions.
        Include colors, patterns, styles, and brands if visible.
        For distinguishing features, include things like:
        - Hair color, style, length
        - Facial features (beard, glasses, etc.)
        - Accessories (backpack, hat, jewelry, etc.)
        - Any visible marks or characteristics
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        },
                    ],
                }
            ],
            max_tokens=500,
            temperature=0.5  # Lower temperature for more consistent outputs
        )

        # Extract and parse the JSON response
        content = response.choices[0].message.content
        # Remove any markdown code block indicators if present
        content = content.replace("```json", "").replace("```", "").strip()
        description = json.loads(content)
        
        processing_time = time.time() - start_time
        logger.info(f"GPT-4 Vision analysis completed in {processing_time:.2f} seconds")
        
        return description

    except json.JSONDecodeError as e:
        logger.error(f"Error parsing GPT response: {str(e)}")
        return {
            "error": "Failed to parse GPT response",
            "status": "error"
        }
    except Exception as e:
        logger.error(f"Error in describe_clothing: {str(e)}")
        return {
            "error": f"Failed to process image: {str(e)}",
            "status": "error"
        } 