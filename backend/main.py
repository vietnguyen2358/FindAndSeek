from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

# Import the image_analyzer module - use absolute import to ensure it works correctly
from image_analyzer import analyze_image

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Image Analysis API", version="1.0.0")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check for OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable is missing.")

@app.get("/")
def root():
    return {"message": "Welcome to the Image Analysis API"}

@app.post("/api/analyze-image")
async def analyze_image_endpoint(file: UploadFile = File(...)):
    """
    Analyze an image using OpenAI's vision model to detect people and their characteristics
    """
    # Call the analyze_image function from our imported module
    # This will return a properly formatted response
    return await analyze_image(file)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
