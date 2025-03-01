from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from yolo import detect_people, Detection
from gpt import describe_clothing, client
from models import ProcessingResponse, PersonDescription, Clothing
import shutil
import os
import logging
import time
from typing import List, Dict
from datetime import datetime
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic model for text request
class TextRequest(BaseModel):
    text: str

app = FastAPI(
    title="Find and Seek API",
    description="API for detecting and describing people in images/videos using YOLOv8 and GPT-4 Vision",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
UPLOAD_DIR = "uploads"
RESULTS_DIR = "results"
for directory in [UPLOAD_DIR, RESULTS_DIR]:
    os.makedirs(directory, exist_ok=True)

def cleanup_old_files(directory: str, max_age_hours: int = 24):
    """Clean up files older than max_age_hours"""
    current_time = time.time()
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        if os.path.isfile(filepath):
            file_age = current_time - os.path.getmtime(filepath)
            if file_age > max_age_hours * 3600:
                try:
                    os.remove(filepath)
                    logger.info(f"Cleaned up old file: {filepath}")
                except Exception as e:
                    logger.error(f"Error cleaning up {filepath}: {e}")

@app.get("/")
async def root():
    return JSONResponse({
        "message": "Welcome to Find and Seek API",
        "endpoints": {
            "/": "This information",
            "/process/": "POST - Upload an image/video for processing",
            "/health": "GET - Check API health status"
        },
        "docs_url": "/docs",
        "status": "running"
    })

@app.post("/process/", response_model=ProcessingResponse)
async def process_media(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    start_time = time.time()
    
    try:
        # Validate file type
        content_type = file.content_type
        if not (content_type.startswith('image/') or content_type.startswith('video/')):
            raise HTTPException(
                status_code=400,
                detail="File must be an image or video"
            )

        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        # Save file locally
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save uploaded file: {str(e)}"
            )

        try:
            # Detect people
            detections, media_type = detect_people(file_path)
            
            if not detections:
                return ProcessingResponse(
                    status="success",
                    message="No people detected",
                    media_type=media_type,
                    total_persons=0,
                    detections=[],
                    processing_time=time.time() - start_time
                )

            # Process each detection
            processed_detections = []
            for idx, detection in enumerate(detections):
                # Get clothing description from GPT-4 Vision
                description = describe_clothing(detection.image)
                
                if isinstance(description, dict) and "error" not in description:
                    # Create PersonDescription object
                    person_desc = PersonDescription(
                        id=idx + 1,
                        frame_number=detection.frame_number,
                        timestamp=detection.timestamp,
                        gender=description["gender"],
                        age_estimate=description["age_estimate"],
                        clothing=Clothing(**description["clothing"]),
                        distinguishing_features=description["distinguishing_features"],
                        confidence_score=detection.confidence,
                        bounding_box={
                            "x1": detection.box[0],
                            "y1": detection.box[1],
                            "x2": detection.box[2],
                            "y2": detection.box[3]
                        }
                    )
                    processed_detections.append(person_desc)

            # Schedule cleanup
            background_tasks.add_task(cleanup_old_files, UPLOAD_DIR)
            background_tasks.add_task(cleanup_old_files, RESULTS_DIR)

            return ProcessingResponse(
                status="success",
                message=f"Successfully processed {media_type}",
                media_type=media_type,
                total_persons=len(processed_detections),
                detections=processed_detections,
                processing_time=time.time() - start_time
            )

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error processing file: {str(e)}"
            )

        finally:
            # Clean up the uploaded file
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    logger.error(f"Error removing temporary file {file_path}: {e}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "upload_dir": os.path.exists(UPLOAD_DIR),
        "results_dir": os.path.exists(RESULTS_DIR)
    }

@app.post("/gpt/text")
async def process_text(request: TextRequest):
    """
    Test endpoint to process text with GPT-4
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "user", "content": request.text}
            ],
            max_tokens=500
        )
        
        return {
            "response": response.choices[0].message.content,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error processing text with GPT: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing text: {str(e)}"
        ) 