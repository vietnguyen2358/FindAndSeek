from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import openai
from openai import OpenAI
import base64
from PIL import Image
import io
import numpy as np

# Load environment variables
load_dotenv()

# Initialize OpenAI clients
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
groq_client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY")
)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for request/response validation
class DetectedPersonDetails(BaseModel):
    age: str
    clothing: str
    environment: str
    movement: str
    distinctive_features: List[str]

class Detection(BaseModel):
    confidence: float
    bbox: List[float]
    description: str
    details: DetectedPersonDetails

class ImageAnalysisResult(BaseModel):
    detections: List[Detection]
    summary: str

class SearchQuery(BaseModel):
    query: str

# Add a health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "FastAPI server is running"}

# Get embeddings for text using Groq
def get_embeddings(text: str) -> List[float]:
    """Get embeddings for text using Groq"""
    try:
        response = groq_client.embeddings.create(
            model="grok-2-1212",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error getting embeddings: {e}")
        return []

def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    if not a or not b:
        return 0
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# First stage: Detect people in the image using GPT-4V
async def detect_people(image_data: bytes) -> List[dict]:
    """First stage: Detect people in the image using GPT-4V"""
    try:
        # Convert image to base64
        base64_image = base64.b64encode(image_data).decode('utf-8')

        response = await openai_client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "system",
                    "content": """You are a computer vision system specialized in detecting people in surveillance footage.
                    For each person detected, provide:
                    1. Precise bounding box coordinates [x, y, width, height] as normalized values between 0-1
                    2. Detection confidence score between 0-1
                    Return ONLY a JSON array of detections with no additional text."""
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": { "url": f"data:image/jpeg;base64,{base64_image}" }
                        }
                    ]
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=500
        )

        result = response.choices[0].message.content
        return result.get("detections", [])
    except Exception as e:
        print(f"Error detecting people: {e}")
        return []

# Second stage: Analyze each detected person in detail
async def analyze_person(image_data: bytes, bbox: List[float]) -> dict:
    """Second stage: Analyze each detected person in detail"""
    try:
        # Convert image to base64
        base64_image = base64.b64encode(image_data).decode('utf-8')

        response = await openai_client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "system",
                    "content": """Analyze this cropped image of a person and provide detailed information in the following JSON format:
                    {
                        "description": "Brief one-line description",
                        "details": {
                            "age": "Estimated age range",
                            "clothing": "Detailed clothing description",
                            "environment": "Immediate surroundings and context",
                            "movement": "Direction and type of movement",
                            "distinctive_features": ["List", "of", "notable", "characteristics"]
                        }
                    }"""
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": { "url": f"data:image/jpeg;base64,{base64_image}" }
                        }
                    ]
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=500
        )

        return response.choices[0].message.content
    except Exception as e:
        print(f"Error analyzing person: {e}")
        return {
            "description": "Analysis failed",
            "details": {
                "age": "Unknown",
                "clothing": "Not visible",
                "environment": "Not specified",
                "movement": "Unknown",
                "distinctive_features": []
            }
        }

# Routes
@app.post("/api/analyze-image", response_model=ImageAnalysisResult)
async def analyze_image(file: UploadFile = File(...)):
    """Analyze an image for person detection"""
    try:
        # Read image data
        image_data = await file.read()

        # First stage: Detect people
        detections = await detect_people(image_data)

        # Second stage: Analyze each person
        detailed_detections = []
        for detection in detections:
            analysis = await analyze_person(image_data, detection["bbox"])
            detailed_detections.append({
                **detection,
                **analysis
            })

        return {
            "detections": detailed_detections,
            "summary": f"Detected {len(detections)} people in the scene"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search")
async def search_detections(query: SearchQuery, detections: List[ImageAnalysisResult]):
    """Match search terms with detections using semantic search"""
    try:
        # Get embeddings for search query
        query_embedding = get_embeddings(query.query)

        # Get embeddings for each detection
        matches = []
        for idx, detection in enumerate(detections):
            for det in detection.detections:
                # Create full description including all details
                full_desc = f"{det.description} {det.details.clothing} {' '.join(det.details.distinctive_features)}"
                det_embedding = get_embeddings(full_desc)

                # Calculate similarity
                similarity = cosine_similarity(query_embedding, det_embedding)
                if similarity > 0.7:  # Threshold for considering it a match
                    matches.append(idx)

        return {"matches": list(set(matches))}  # Remove duplicates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)