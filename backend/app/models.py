from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union

class Clothing(BaseModel):
    upper: str = "Unknown"
    lower: str = "Unknown"
    footwear: str = "Unknown"

class PersonAnalysis(BaseModel):
    gender: str
    age_estimate: str
    clothing: Clothing
    ethnicity: Optional[str] = None
    distinguishing_features: List[str] = []
    location: Optional[str] = None
    confidence_score: float
    
class ImageAnalysisResponse(BaseModel):
    success: bool
    message: str
    analysis: Optional[PersonAnalysis] = None
    error: Optional[str] = None

# New models for the comparison endpoint

class MissingPersonInfo(BaseModel):
    person_id: str
    gender: str
    age_estimate: str
    clothing: Dict[str, str]
    ethnicity: Optional[str] = None
    distinguishing_features: List[str] = []
    location: Optional[str] = None
    time: Optional[str] = None
    error: Optional[str] = None

class DetectedPerson(BaseModel):
    person_id: str
    gender: str
    age_estimate: str
    clothing: Dict[str, str]
    ethnicity: Optional[str] = None
    distinguishing_features: List[str] = []
    error: Optional[str] = None

class PersonComparison(BaseModel):
    person: DetectedPerson
    similarity_score: float
    potential_match: bool

class ComparisonResult(BaseModel):
    comparison_results: Union[List[PersonComparison], str]
    method: str
    error: Optional[str] = None

class ImageComparisonResponse(BaseModel):
    success: bool
    missing_person: MissingPersonInfo
    detected_people: List[DetectedPerson]
    comparison: ComparisonResult
    error: Optional[str] = None
    message: Optional[str] = None 