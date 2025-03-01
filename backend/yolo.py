import cv2
import numpy as np
from ultralytics import YOLO
import os
import logging
from typing import List, Tuple, Optional
import torch

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the directory where this file is located
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, 'yolov8n.pt')

# Detection parameters
CONFIDENCE_THRESHOLD = 0.3
PADDING_RATIO = 0.1  # Padding as a ratio of detection box size

def load_yolo_model() -> YOLO:
    """Load the YOLO model with proper error handling"""
    try:
        logger.info(f"Loading YOLO model from {MODEL_PATH}")
        if not os.path.exists(MODEL_PATH):
            logger.info("Model file not found, downloading...")
            # This will automatically download the model
            model = YOLO('yolov8n')
            model.to('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            logger.info("Loading existing model file...")
            model = YOLO(MODEL_PATH)
            model.to('cuda' if torch.cuda.is_available() else 'cpu')
        
        logger.info(f"YOLO model loaded successfully on {'CUDA' if torch.cuda.is_available() else 'CPU'}")
        return model
    except Exception as e:
        logger.error(f"Error loading YOLO model: {str(e)}")
        raise

def add_padding(
    box: Tuple[int, int, int, int],
    image_shape: Tuple[int, int],
    padding_ratio: float = PADDING_RATIO
) -> Tuple[int, int, int, int]:
    """Add padding to detection box with bounds checking"""
    x1, y1, x2, y2 = box
    width = x2 - x1
    height = y2 - y1
    
    # Calculate padding
    padding_x = int(width * padding_ratio)
    padding_y = int(height * padding_ratio)
    
    # Apply padding with bounds checking
    x1 = max(0, x1 - padding_x)
    y1 = max(0, y1 - padding_y)
    x2 = min(image_shape[1], x2 + padding_x)
    y2 = min(image_shape[0], y2 + padding_y)
    
    return (x1, y1, x2, y2)

# Initialize YOLO model
model = load_yolo_model()

def detect_and_crop_people(image_path: str) -> List[np.ndarray]:
    """
    Detect people in an image and return cropped images of each person
    
    Args:
        image_path: Path to the input image
        
    Returns:
        List of cropped images as numpy arrays
    """
    try:
        # Read image
        logger.info(f"Reading image from {image_path}")
        image = cv2.imread(image_path)
        if image is None:
            logger.warning("Failed to read image")
            return []

        # Run YOLO detection
        logger.info("Running YOLO detection")
        results = model(image, conf=CONFIDENCE_THRESHOLD)
        
        cropped_images = []
        
        # Process detections
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Only process if detection is a person (class 0 in COCO)
                if box.cls[0] == 0:  # Person class
                    confidence = float(box.conf[0])
                    if confidence > CONFIDENCE_THRESHOLD:
                        # Get coordinates
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        
                        # Add padding
                        x1, y1, x2, y2 = add_padding(
                            (x1, y1, x2, y2),
                            image.shape
                        )
                        
                        # Crop image
                        cropped = image[y1:y2, x1:x2]
                        if cropped.size > 0:
                            cropped_images.append(cropped)
                            logger.info(f"Person detected with confidence: {confidence:.2f}")

        logger.info(f"Found {len(cropped_images)} people in the image")
        return cropped_images

    except Exception as e:
        logger.error(f"Error in detect_and_crop_people: {str(e)}")
        return [] 