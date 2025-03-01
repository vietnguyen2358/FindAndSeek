import base64
import json
import os
import cv2
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment variable for security
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# OpenAI client setup
client = OpenAI(api_key=OPENAI_API_KEY)

def encode_image(image):
    """Encode an OpenCV image to base64"""
    _, buffer = cv2.imencode(".jpg", image)
    return base64.b64encode(buffer).decode("utf-8")

def describe_clothing(image):
    """Generate clothing description using GPT-4 Vision"""
    try:
        base64_image = encode_image(image)

        prompt = """
        You are an AI vision assistant helping in Search and Rescue (SAR) and Amber Alert cases.
        Analyze the detected person in the image and provide a structured JSON description.
        
        Return a JSON with:
        - `gender`: Estimated gender or "Unknown"
        - `age_estimate`: Approximate age range
        - `clothing`: A dictionary containing:
          - `upper`: Shirt, hoodie, jacket, etc. (Include color)
          - `lower`: Pants, jeans, skirt, shorts, etc. (Include color)
          - `footwear`: Shoes, boots, sandals, etc. (Include color)
        - `distinguishing_features`: List of unique features (glasses, hat, backpack, scars, tattoos, hair color, accessories)
        """

        response = client.chat.completions.create(
            model="gpt-4-vision-preview",
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
            max_tokens=500
        )

        # Extract and parse the JSON response
        content = response.choices[0].message.content
        # Remove any markdown code block indicators if present
        content = content.replace("```json", "").replace("```", "").strip()
        return json.loads(content)

    except Exception as e:
        return {
            "error": f"Failed to process image: {str(e)}",
            "status": "error"
        } 