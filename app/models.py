from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class TransportMode(str, Enum):
    WALKING = "walking"
    VEHICLE = "vehicle"

class AIAnalysis(BaseModel):
    entities: List[str] = []
    locations: List[str] = []
    timestamps: List[str] = []
    confidence: float = 0

    class Config:
        allow_population_by_field_name = True

class SearchRadius(BaseModel):
    radius: float = 0
    probableLocations: List[Dict[str, Any]] = []

    class Config:
        allow_population_by_field_name = True

class TimelineEvent(BaseModel):
    time: str
    event: str
    details: Optional[Dict[str, Any]] = None

    class Config:
        allow_population_by_field_name = True

class CaseBase(BaseModel):
    description: str
    lastLocation: Optional[str] = None
    missingPersonName: str
    missingPersonAge: int
    missingPersonDescription: str
    contactInfo: str

    class Config:
        allow_population_by_field_name = True

class Case(CaseBase):
    id: int
    status: str = "active"
    timeline: List[TimelineEvent] = []
    createdAt: datetime
    images: List[str] = []
    aiAnalysis: AIAnalysis = Field(default_factory=AIAnalysis)
    searchRadius: SearchRadius = Field(default_factory=SearchRadius)
    lastSighting: Optional[str] = None
    transportMode: TransportMode = TransportMode.WALKING

    class Config:
        allow_population_by_field_name = True

class CameraAIAnalysis(BaseModel):
    detections: List[Dict[str, Any]] = []
    summary: str = ""
    processedAt: Optional[str] = None

    class Config:
        allow_population_by_field_name = True

class CameraFootageBase(BaseModel):
    caseId: int
    location: str
    footage: str
    timestamp: str

    class Config:
        allow_population_by_field_name = True

class CameraFootage(CameraFootageBase):
    id: int
    aiAnalysis: CameraAIAnalysis = Field(default_factory=CameraAIAnalysis)

    class Config:
        allow_population_by_field_name = True

class MovementPrediction(BaseModel):
    lat: float
    lng: float
    timeElapsed: float
    transportMode: TransportMode

    class Config:
        allow_population_by_field_name = True 