from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import time
from datetime import datetime
import os
from models import Clothing, PersonDescription, ProcessingResponse
from constants import OPENAI_API_KEY, GROQ_API_KEY
from yolo import detect_persons, save_output_image
from gpt import get_person_description
import cv2
import traceback

# Create output directory if it doesn't exist
os.makedirs("backend/output", exist_ok=True)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return JSONResponse({
        "message": "Welcome to Find & Seek API",
        "endpoints": {
            "/": "This information",
            "/process/": "POST - Upload an image/video for processing",
            "/health": "GET - Check API health status"
        },
        "docs_url": "/docs",
        "status": "running"
    })

@app.get("/health")
async def health_check():
    return JSONResponse({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "api_keys": {
            "openai": "configured" if OPENAI_API_KEY else "missing",
            "groq": "configured" if GROQ_API_KEY else "missing"
        }
    })

@app.post("/process", response_model=ProcessingResponse)
async def process_media(file: UploadFile = File(...)):
    """
    Process an uploaded image or video file:
    1. Detect persons using YOLOv8
    2. Analyze each person using GPT-4 Vision
    3. Return structured response
    """
    start_time = time.time()
    
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Only image files are supported at this time")
        
        # Read file content
        image_data = await file.read()
        
        # Detect persons
        persons_data, annotated_img, detection_time = detect_persons(image_data)
        
        # Save the annotated image
        timestamp = int(time.time())
        output_filename = f"processed_{timestamp}.jpg"
        save_output_image(annotated_img, output_filename)
        
        # Process each detected person with GPT
        person_descriptions = []
        
        for person in persons_data:
            # Extract person crop from detection
            person_crop = person.get("person_crop")
            
            # Get person description from GPT
            description = get_person_description(person, person_crop)
            
            # Create PersonDescription object with proper bounding box format
            bbox = person["bounding_box"]
            
            person_desc = PersonDescription(
                id=person["id"],
                timestamp=time.time(),
                gender=description.get("gender", "Unknown"),
                age_estimate=description.get("age_estimate", "Unknown"),
                clothing=Clothing(
                    upper=description.get("clothing", {}).get("upper", "Unknown"),
                    lower=description.get("clothing", {}).get("lower", "Unknown"),
                    footwear=description.get("clothing", {}).get("footwear", "Unknown")
                ),
                distinguishing_features=description.get("distinguishing_features", []),
                confidence_score=person["confidence_score"],
                bounding_box=bbox  # This is already a Dict[str, int]
            )
            
            person_descriptions.append(person_desc)
        
        # Create final response
        total_time = time.time() - start_time
        
        response = ProcessingResponse(
            status="success",
            message=f"Processed {len(person_descriptions)} persons in {total_time:.2f} seconds",
            media_type="image",
            total_persons=len(person_descriptions),
            processing_time=total_time,
            detections=person_descriptions
        )
        
        return response
        
    except Exception as e:
        # Log the error with traceback for debugging
        print(f"Error processing image: {str(e)}")
        traceback.print_exc()
        
        # Return error response
        return ProcessingResponse(
            status="error",
            message="Failed to process the image",
            media_type="unknown",
            total_persons=0,
            processing_time=time.time() - start_time,
            detections=[],
            error=str(e)
        )

if __name__ == "__main__":
    uvicorn.run('main:app', host="0.0.0.0", port=8000, reload=True)