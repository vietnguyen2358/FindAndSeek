import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any, List
import uvicorn
from dotenv import load_dotenv

from app.image_utils import encode_image_to_base64, analyze_image_with_openai
from app.models import ImageAnalysisResponse, PersonAnalysis, Clothing
# Import the new comparison utilities
from app.compare_utils import analyze_missing_person, detect_people_in_search_image, compare_with_groq

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Image Analysis API",
    description="API for analyzing images using OpenAI's GPT-4o",
    version="1.0.0"
)

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to the Image Analysis API"}

@app.post("/api/analyzeimage", response_model=ImageAnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze an image to extract information about a person.
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        return ImageAnalysisResponse(
            success=False,
            message="Invalid file type. Please upload an image.",
            error="Invalid file type"
        )
    
    try:
        # Read the uploaded file
        image_bytes = await file.read()
        
        # Encode the image to base64
        image_base64 = encode_image_to_base64(image_bytes)
        
        # Analyze the image with OpenAI
        analysis_result = analyze_image_with_openai(image_base64)
        
        # Create a PersonAnalysis object from the result
        clothing = Clothing(
            upper=analysis_result.get("clothing", {}).get("upper", "Unknown"),
            lower=analysis_result.get("clothing", {}).get("lower", "Unknown"),
            footwear=analysis_result.get("clothing", {}).get("footwear", "Unknown")
        )
        
        person_analysis = PersonAnalysis(
            gender=analysis_result.get("gender", "Unknown"),
            age_estimate=analysis_result.get("age_estimate", "Unknown"),
            clothing=clothing,
            ethnicity=analysis_result.get("ethnicity"),
            distinguishing_features=analysis_result.get("distinguishing_features", []),
            location=analysis_result.get("location"),
            confidence_score=analysis_result.get("confidence_score", 0.0)
        )
        
        # Return successful response
        return ImageAnalysisResponse(
            success=True,
            message="Image analysis completed successfully",
            analysis=person_analysis
        )
        
    except Exception as e:
        # Handle any exceptions
        error_message = str(e)
        return ImageAnalysisResponse(
            success=False,
            message="An error occurred during image analysis",
            error=error_message
        )

@app.post("/api/compare-images")
async def compare_images(
    missing_person_image: UploadFile = File(...),
    search_image: UploadFile = File(...)
):
    """
    Compare a missing person image with a search image to identify potential matches.
    
    This endpoint:
    1. Analyzes the missing person image using OpenAI
    2. Detects people in the search image using YOLO (if available)
    3. Compares the missing person with detected individuals using Groq (if available)
    
    It works with a graceful degradation approach - if dependencies like YOLO or Groq
    are not available, it will still function with basic comparison.
    
    Returns the analysis results and comparison data.
    """
    # Validate file types
    if not missing_person_image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Missing person file must be an image")
    
    if not search_image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Search image file must be an image")
    
    try:
        # Read the image files
        missing_person_bytes = await missing_person_image.read()
        search_image_bytes = await search_image.read()
        
        # Step 1: Analyze missing person image
        missing_person_data = analyze_missing_person(missing_person_bytes)
        
        # Step 2: Detect and analyze people in search image
        search_people_data = detect_people_in_search_image(search_image_bytes)
        
        # Step 3: Compare data with Groq (or mock comparison if unavailable)
        comparison_result = compare_with_groq(missing_person_data, search_people_data)
        
        # Return the comprehensive results
        return {
            "success": True,
            "missing_person": missing_person_data,
            "detected_people": search_people_data,
            "comparison": comparison_result
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "An error occurred during image comparison"
        }

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host=host, port=port, reload=True) 