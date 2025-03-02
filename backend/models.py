from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union
from datetime import datetime

class Clothing(BaseModel):
    upper: str = Field(..., description="Upper body clothing description including color")
    lower: str = Field(..., description="Lower body clothing description including color")
    footwear: str = Field(..., description="Footwear description including color")

class PersonDescription(BaseModel):
    id: int = Field(..., description="Unique identifier for the person in the frame")
    frame_number: Optional[int] = Field(None, description="Frame number for video detections")
    timestamp: float = Field(..., description="Timestamp of detection")
    gender: str = Field(..., description="Estimated gender or 'Unknown'")
    age_estimate: str = Field(..., description="Approximate age range")
    clothing: Clothing
    distinguishing_features: List[str] = Field(default_factory=list, description="List of unique features")
    confidence_score: float = Field(..., description="Detection confidence score")
    bounding_box: Dict[str, int] = Field(..., description="Coordinates of detection box [x1, y1, x2, y2]")

class ProcessingResponse(BaseModel):
    status: str = Field(..., description="Status of processing (success/error)")
    message: str = Field(..., description="Processing status message")
    media_type: str = Field(..., description="Type of media processed (image/video)")
    total_persons: int = Field(..., description="Total number of persons detected")
    processing_time: float = Field(..., description="Time taken to process in seconds")
    detections: List[PersonDescription] = Field(default_factory=list, description="List of detected persons")
    error: Optional[str] = Field(None, description="Error message if any") 