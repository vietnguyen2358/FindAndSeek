from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime

class Clothing(BaseModel):
    upper: str = Field(..., description="Upper body clothing description including color")
    lower: str = Field(..., description="Lower body clothing description including color")
    footwear: str = Field(..., description="Footwear description including color")

class PersonDescription(BaseModel):
    gender: str = Field(..., description="Estimated gender or 'Unknown'")
    age_estimate: str = Field(..., description="Approximate age range")
    clothing: Clothing
    distinguishing_features: List[str] = Field(default_factory=list, description="List of unique features")
    confidence_score: Optional[float] = Field(None, description="Detection confidence score")
    timestamp: datetime = Field(default_factory=datetime.now, description="Time of detection")

class ProcessingResponse(BaseModel):
    message: str = Field(..., description="Processing status message")
    descriptions: List[PersonDescription] = Field(default_factory=list, description="List of detected persons")
    error: Optional[str] = Field(None, description="Error message if any")
    total_persons: int = Field(..., description="Total number of persons detected")
    processing_time: float = Field(..., description="Time taken to process the image in seconds") 