from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import uvicorn

# Create FastAPI app
app = FastAPI(
    title="Simple API",
    description="A simple API with a dummy endpoint",
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
async def root() -> Dict[str, str]:
    """
    Root endpoint that returns a welcome message.
    """
    return {"message": "Welcome to the Simple API"}

@app.get("/api/dummy")
async def dummy_endpoint() -> Dict[str, str]:
    """
    A dummy endpoint that returns a simple message.
    """
    return {
        "status": "success",
        "message": "This is a dummy endpoint",
        "data": "Hello, world!"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True) 