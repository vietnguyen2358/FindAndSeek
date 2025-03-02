import base64
import json
import os
import numpy as np
from typing import Dict, Any, List, Optional
import importlib.util

# Check if OpenCV is available
OPENCV_AVAILABLE = importlib.util.find_spec("cv2") is not None
if OPENCV_AVAILABLE:
    import cv2

# Check if needed libraries are available
YOLO_AVAILABLE = importlib.util.find_spec("ultralytics") is not None
GROQ_AVAILABLE = False  # Set to False to avoid proxies error

# Import libraries if available
if YOLO_AVAILABLE:
    from ultralytics import YOLO

# Import OpenAI - Use version 0.28.0 style
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize clients with API keys from environment variables
openai_api_key = os.getenv("OPENAI_API_KEY", "")
groq_api_key = os.getenv("GROQ_API_KEY", "")

# Set OpenAI API key for version 0.28.0
openai.api_key = openai_api_key

# No Groq initialization to avoid proxies error
groq_client = None

# Initialize YOLO model if available
yolo_model = None
if YOLO_AVAILABLE and OPENCV_AVAILABLE:
    try:
        yolo_model = YOLO("yolov8n.pt")
        print("YOLO model loaded successfully")
    except Exception as e:
        print(f"Failed to load YOLO model: {str(e)}")
        yolo_model = None

def encode_image_to_base64(image_bytes: bytes) -> str:
    """
    Encodes image bytes to base64 string.
    """
    return base64.b64encode(image_bytes).decode("utf-8")

def parse_openai_response(response) -> Dict[str, Any]:
    """
    Extracts and cleans JSON response from OpenAI.
    """
    raw_content = response.choices[0].message.content.strip()

    # Remove markdown artifacts (e.g., ```json ... ```)
    if "```json" in raw_content:
        raw_content = raw_content.split("```json")[1].split("```")[0].strip()
    elif "```" in raw_content:
        raw_content = raw_content.split("```")[1].split("```")[0].strip()

    try:
        return json.loads(raw_content)
    except json.JSONDecodeError:
        return {"error": "Invalid JSON response from OpenAI"}

def analyze_missing_person(image_bytes: bytes) -> Dict[str, Any]:
    """
    Analyzes an image of a missing person using OpenAI.
    """
    # Encode the image to base64
    image_base64 = encode_image_to_base64(image_bytes)
    
    missing_person_prompt = """
    You are an AI assisting in missing person cases. Analyze this image and return a JSON response with:
    {
      "person_id": "unique_identifier",
      "gender": "Male/Female/Unknown",
      "age_estimate": "Approximate age range",
      "clothing": {
        "upper": "Shirt, hoodie, jacket (Include color)",
        "lower": "Pants, jeans, skirt, shorts (Include color)",
        "footwear": "Shoes, boots, sandals (Include color)"
      },
      "ethnicity": "White, Black, Asian, etc",
      "distinguishing_features": ["glasses", "hat", "backpack", "tattoos"],
      "location": "Last known location",
      "time": "Last seen time"
    }

    IMPORTANT: **Return ONLY JSON**. Do NOT add explanations, markdown, or extra text.
    """
    
    try:
        # OpenAI API call - using version 0.28.0 style
        missing_person_response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": missing_person_prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}},
                    ],
                }
            ],
            max_tokens=500,
        )
        
        # Parse response
        return parse_openai_response(missing_person_response)
    except Exception as e:
        print(f"Error calling OpenAI API: {str(e)}")
        return {
            "error": f"Error analyzing missing person image: {str(e)}",
            "person_id": "error",
            "gender": "Unknown",
            "age_estimate": "Unknown",
            "clothing": {
                "upper": "Unknown",
                "lower": "Unknown",
                "footwear": "Unknown"
            },
            "distinguishing_features": [],
            "location": "Unknown",
            "time": "Unknown"
        }

def detect_people_in_search_image(image_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Detects people in a search image using YOLO and analyzes them using OpenAI.
    """
    if not OPENCV_AVAILABLE:
        print("OpenCV not available, using mock detection data")
        return [
            {
                "person_id": "mock_person_1",
                "gender": "Male",
                "age_estimate": "30-40",
                "clothing": {
                    "upper": "Blue shirt",
                    "lower": "Black jeans",
                    "footwear": "Brown shoes"
                },
                "distinguishing_features": ["glasses"],
                "ethnicity": "White"
            }
        ]
    
    if not YOLO_AVAILABLE or yolo_model is None:
        print("YOLO not available, using mock detection data")
        return [
            {
                "person_id": "mock_person_1",
                "gender": "Male",
                "age_estimate": "30-40",
                "clothing": {
                    "upper": "Blue shirt",
                    "lower": "Black jeans",
                    "footwear": "Brown shoes"
                },
                "distinguishing_features": ["glasses"],
                "ethnicity": "White"
            }
        ]
    
    try:
        # Convert bytes to OpenCV image
        nparr = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        
        # Run YOLO on the image
        search_results = yolo_model(nparr)
        
        # Process detections & extract cropped images
        search_crops = []
        for result in search_results:
            if hasattr(result, "boxes") and result.boxes is not None:
                for box in result.boxes.xyxy:
                    x1, y1, x2, y2 = map(int, box)
                    crop = nparr[y1:y2, x1:x2]
                    if crop.size > 0:
                        search_crops.append(crop)
        
        # If no people detected, return mock data
        if not search_crops:
            print("No people detected in the search image")
            return [
                {
                    "person_id": "mock_person_1",
                    "gender": "Male",
                    "age_estimate": "30-40",
                    "clothing": {
                        "upper": "Blue shirt",
                        "lower": "Black jeans",
                        "footwear": "Brown shoes"
                    },
                    "distinguishing_features": ["glasses"],
                    "ethnicity": "White"
                }
            ]
        
        # Convert crops to base64
        search_base64_images = [base64.b64encode(cv2.imencode(".jpg", crop)[1]).decode("utf-8") for crop in search_crops]
        
        # Create the prompt
        search_people_prompt = """
        You are an AI assistant in search and rescue. Analyze these detected individuals and return structured JSON for each person with:
        {
          "person_id": "unique_identifier",
          "gender": "Male/Female/Unknown",
          "age_estimate": "Approximate age range",
          "clothing": {
            "upper": "Shirt, hoodie, jacket (Include color)",
            "lower": "Pants, jeans, skirt, shorts (Include color)",
            "footwear": "Shoes, boots, sandals (Include color)"
          },
          "distinguishing_features": ["glasses", "hat", "backpack", "tattoos"],
          "ethnicity": "White, Black, Asian, etc"
        }

        IMPORTANT: **Return ONLY JSON**. Do NOT add explanations, markdown, or extra text.
        """
        
        # OpenAI API call - using version 0.28.0 style
        search_people_response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [{"type": "text", "text": search_people_prompt}] + [
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img}"}}
                        for img in search_base64_images
                    ],
                }
            ],
            max_tokens=800,
        )
        
        # Parse response
        result = parse_openai_response(search_people_response)
        
        # Ensure result is a list
        if isinstance(result, dict):
            if "error" in result:
                return [result]
            else:
                return [result]
        
        return result
    except Exception as e:
        print(f"Error detecting people in search image: {str(e)}")
        return [
            {
                "error": f"Error detecting people: {str(e)}",
                "person_id": "error",
                "gender": "Unknown",
                "age_estimate": "Unknown",
                "clothing": {
                    "upper": "Unknown",
                    "lower": "Unknown",
                    "footwear": "Unknown"
                },
                "distinguishing_features": [],
                "ethnicity": "Unknown"
            }
        ]

def compare_with_groq(missing_person_data: Dict[str, Any], search_people_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compares missing person data with detected individuals using Groq's LLM.
    """
    if not GROQ_AVAILABLE or groq_client is None:
        print("Groq not available, using mock comparison data")
        
        # Create mock similarity data
        results = []
        for i, person in enumerate(search_people_data):
            similarity_score = 0.5  # Default score
            
            # Check for matches in basic attributes
            if missing_person_data.get("gender") == person.get("gender"):
                similarity_score += 0.1
            
            if missing_person_data.get("ethnicity") == person.get("ethnicity"):
                similarity_score += 0.1
                
            # Check clothing matches
            missing_clothing = missing_person_data.get("clothing", {})
            detected_clothing = person.get("clothing", {})
            
            if missing_clothing.get("upper") and detected_clothing.get("upper"):
                if missing_clothing["upper"].lower() in detected_clothing["upper"].lower() or \
                   detected_clothing["upper"].lower() in missing_clothing["upper"].lower():
                    similarity_score += 0.1
            
            if missing_clothing.get("lower") and detected_clothing.get("lower"):
                if missing_clothing["lower"].lower() in detected_clothing["lower"].lower() or \
                   detected_clothing["lower"].lower() in missing_clothing["lower"].lower():
                    similarity_score += 0.1
            
            results.append({
                "person": person,
                "similarity_score": min(round(similarity_score, 2), 1.0),
                "potential_match": similarity_score > 0.6
            })
        
        # Sort by similarity score
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        return {
            "comparison_results": results,
            "method": "mock comparison (Groq unavailable)"
        }
    
    try:
        # Create the prompt
        groq_prompt = f"""
        Compare AND SORT the missing person data with the detected individuals from the search image.

        Missing Person Data:
        {json.dumps(missing_person_data, indent=4)}

        Detected Individuals in Search Image:
        {json.dumps(search_people_data, indent=4)}

        Provide structured JSON output highlighting similarities and differences, with percentage of similarity for each person.

        IMPORTANT: **Return ONLY JSON**. Do NOT add explanations, markdown, or extra text.
        """
        
        # Groq API call
        groq_response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": groq_prompt}],
            max_tokens=600,
        )
        
        # Extract and parse Groq's response
        groq_analysis = groq_response.choices[0].message.content
        
        # Try to parse as JSON
        try:
            return json.loads(groq_analysis)
        except json.JSONDecodeError:
            # If parsing fails, return the raw response
            return {
                "comparison_results": groq_analysis,
                "method": "groq analysis (raw response, failed to parse as JSON)"
            }
    except Exception as e:
        print(f"Error comparing with Groq: {str(e)}")
        return {
            "error": f"Error in Groq comparison: {str(e)}",
            "comparison_results": [],
            "method": "error"
        } 