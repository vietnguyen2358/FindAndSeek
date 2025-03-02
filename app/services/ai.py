from typing import Dict, List, Any, Tuple
import json
import random
from datetime import datetime, timedelta
from ..models import AIAnalysis, SearchRadius, TransportMode

async def analyze_report(description: str) -> AIAnalysis:
    """
    Analyze a case description to extract relevant entities, locations, and timestamps.
    This is a mock implementation that simulates AI analysis.
    """
    # Mock entities extraction
    entities = [
        "blue jacket",
        "jeans",
        "baseball cap",
        "brown hair",
        "glasses"
    ]
    
    # Mock locations extraction
    locations = [
        "Central Park",
        "Main Street",
        "Downtown",
        "Bus Station"
    ]
    
    # Mock timestamps extraction
    timestamps = [
        "2024-03-01T10:00:00Z",
        "2024-03-01T15:30:00Z"
    ]
    
    return AIAnalysis(
        entities=random.sample(entities, k=random.randint(1, 3)),
        locations=random.sample(locations, k=random.randint(1, 2)),
        timestamps=random.sample(timestamps, k=random.randint(1, 2)),
        confidence=random.uniform(0.7, 0.95)
    )

async def analyze_image(image_data: str) -> Dict[str, Any]:
    """
    Analyze an image to detect objects, people, and relevant information.
    This is a mock implementation that simulates image analysis.
    """
    detections = [
        {"class": "person", "confidence": 0.92, "bbox": [100, 200, 150, 300]},
        {"class": "backpack", "confidence": 0.85, "bbox": [250, 220, 280, 260]},
        {"class": "jacket", "confidence": 0.78, "bbox": [120, 210, 140, 280]}
    ]
    
    return {
        "detections": random.sample(detections, k=random.randint(1, 3)),
        "summary": "Detected person wearing dark clothing with a backpack",
        "processedAt": datetime.now().isoformat()
    }

async def predict_movement(
    location: Dict[str, float],
    time_elapsed: float,
    transport_mode: TransportMode
) -> SearchRadius:
    """
    Predict possible movement patterns and generate search radius based on last known location.
    This is a mock implementation that simulates movement prediction.
    """
    # Base speeds (km/h)
    speeds = {
        TransportMode.WALKING: 5.0,
        TransportMode.VEHICLE: 30.0
    }
    
    base_speed = speeds[transport_mode]
    
    # Calculate radius based on time elapsed and transport mode
    radius = (base_speed * time_elapsed) / 3600  # Convert time to hours
    
    # Generate probable locations within the radius
    probable_locations = []
    for _ in range(random.randint(3, 6)):
        angle = random.uniform(0, 360)
        distance = random.uniform(0, radius)
        
        # Simple approximation for demonstration
        lat_change = distance * 0.009 * random.uniform(-1, 1)
        lng_change = distance * 0.009 * random.uniform(-1, 1)
        
        probable_locations.append({
            "lat": location["lat"] + lat_change,
            "lng": location["lng"] + lng_change,
            "probability": random.uniform(0.4, 0.9)
        })
    
    return SearchRadius(
        radius=radius,
        probableLocations=probable_locations
    ) 