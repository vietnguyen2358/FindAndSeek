from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from yolo import detect_and_crop_people
from gpt import describe_clothing
from models import ProcessingResponse, PersonDescription
import shutil
import os
import logging
import time
from typing import List
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Find and Seek API",
    description="API for detecting and describing people in images using YOLOv8 and GPT-4 Vision",
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
            "/upload/": "POST - Upload an image for processing",
            "/health": "GET - Check API health status"
        },
        "docs_url": "/docs",
        "status": "running"
    })

@app.post("/upload/", response_model=ProcessingResponse)
async def upload_image(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    start_time = time.time()
    
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG, etc.)"
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
            # Detect & crop people
            cropped_images = detect_and_crop_people(file_path)
            
            if not cropped_images:
                return ProcessingResponse(
                    message="No people detected in the image",
                    descriptions=[],
                    error="No people detected",
                    total_persons=0,
                    processing_time=time.time() - start_time
                )

            # Describe clothing for each detected person
            descriptions = []
            for img in cropped_images:
                description = describe_clothing(img)
                if isinstance(description, dict) and "error" not in description:
                    descriptions.append(PersonDescription(**description))

            # Schedule cleanup
            background_tasks.add_task(cleanup_old_files, UPLOAD_DIR)
            background_tasks.add_task(cleanup_old_files, RESULTS_DIR)

            return ProcessingResponse(
                message="Successfully processed image",
                descriptions=descriptions,
                total_persons=len(descriptions),
                processing_time=time.time() - start_time
            )

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error processing image: {str(e)}"
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