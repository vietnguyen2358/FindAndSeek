from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any
from .models import (
    Case, CaseBase, CameraFootage, CameraFootageBase,
    AIAnalysis, SearchRadius, MovementPrediction, TimelineEvent
)
from .storage import storage
from .services.ai import analyze_report, analyze_image, predict_movement
from datetime import datetime

router = APIRouter(prefix="/api")

@router.post("/cases", response_model=Case)
async def create_case(case_data: CaseBase):
    try:
        # Create the case
        new_case = await storage.create_case(case_data)

        # Perform AI analysis on the case description
        analysis = await analyze_report(case_data.description)
        new_case = await storage.update_case_ai_analysis(new_case.id, analysis)

        # If we have a last known location, calculate initial search radius
        if case_data.lastLocation:
            # TODO: Geocode the lastLocation string to coordinates
            prediction = await predict_movement(
                {"lat": 0, "lng": 0},  # Default coordinates
                0,  # Initial time elapsed
                "walking"
            )
            new_case = await storage.update_case_search_radius(new_case.id, prediction)

        return new_case
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/cases", response_model=List[Case])
async def get_all_cases():
    return await storage.get_all_cases()

@router.get("/cases/{case_id}", response_model=Case)
async def get_case(case_id: int):
    case = await storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.patch("/cases/{case_id}", response_model=Case)
async def update_case(case_id: int, case_data: Dict[str, Any] = Body(...)):
    try:
        return await storage.update_case(case_id, case_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/cases/{case_id}/analyze-image", response_model=Dict[str, Any])
async def analyze_case_image(case_id: int, image_data: Dict[str, str] = Body(...)):
    try:
        case = await storage.get_case(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        analysis = await analyze_image(image_data["image"])
        
        # Add the image to the case
        updated_case = await storage.update_case(
            case_id,
            {"images": [*case.images, image_data["image"]]}
        )

        # Add a timeline event for the image analysis
        await storage.add_timeline_event(
            case_id,
            TimelineEvent(
                time=analysis["processedAt"],
                event="Image analyzed",
                details=analysis
            )
        )

        return {"analysis": analysis, "case": updated_case}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/footage", response_model=CameraFootage)
async def add_camera_footage(footage_data: CameraFootageBase):
    try:
        new_footage = await storage.add_camera_footage(footage_data)

        # Process the footage with AI
        analysis = await analyze_image(footage_data.footage)
        processed_footage = await storage.update_footage_analysis(
            new_footage.id,
            {
                **analysis,
                "processedAt": analysis["processedAt"]
            }
        )

        # Add a timeline event for the new footage
        await storage.add_timeline_event(
            footage_data.caseId,
            TimelineEvent(
                time=analysis["processedAt"],
                event="New camera footage processed",
                details={
                    "footageId": new_footage.id,
                    "location": footage_data.location,
                    "detections": len(analysis["detections"])
                }
            )
        )

        return processed_footage
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/cases/{case_id}/footage", response_model=List[CameraFootage])
async def get_case_footage(case_id: int):
    return await storage.get_case_footage(case_id)

@router.post("/cases/{case_id}/predict-movement", response_model=Dict[str, Any])
async def predict_case_movement(case_id: int, prediction_data: MovementPrediction):
    try:
        prediction = await predict_movement(
            {"lat": prediction_data.lat, "lng": prediction_data.lng},
            prediction_data.timeElapsed,
            prediction_data.transportMode
        )

        updated_case = await storage.update_case_search_radius(case_id, prediction)

        # Add a timeline event for the prediction update
        await storage.add_timeline_event(
            case_id,
            TimelineEvent(
                time=datetime.now().isoformat(),
                event="Search radius updated",
                details={
                    "radius": prediction.radius,
                    "transportMode": prediction_data.transportMode
                }
            )
        )

        return {"prediction": prediction, "case": updated_case}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 