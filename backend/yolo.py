import cv2
import numpy as np
from ultralytics import YOLO
import os
import logging
from typing import List, Tuple, Optional, Dict, Union
import torch
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the directory where this file is located
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, 'yolov8n.pt')

# Detection parameters
CONFIDENCE_THRESHOLD = 0.3
PADDING_RATIO = 0.1  # Padding as a ratio of detection box size
MAX_VIDEO_FRAMES = 50  # Maximum number of frames to process from video

def load_yolo_model() -> YOLO:
    """Load the YOLO model with proper error handling"""
    try:
        logger.info(f"Loading YOLO model from {MODEL_PATH}")
        if not os.path.exists(MODEL_PATH):
            logger.info("Model file not found, downloading...")
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
    
    padding_x = int(width * padding_ratio)
    padding_y = int(height * padding_ratio)
    
    x1 = max(0, x1 - padding_x)
    y1 = max(0, y1 - padding_y)
    x2 = min(image_shape[1], x2 + padding_x)
    y2 = min(image_shape[0], y2 + padding_y)
    
    return (x1, y1, x2, y2)

# Initialize YOLO model
model = load_yolo_model()

class Detection:
    def __init__(self, image: np.ndarray, box: Tuple[int, int, int, int], confidence: float, frame_number: Optional[int] = None):
        self.image = image
        self.box = box
        self.confidence = confidence
        self.frame_number = frame_number
        self.timestamp = time.time()

def process_frame(frame: np.ndarray, frame_number: Optional[int] = None) -> List[Detection]:
    """Process a single frame and return detections"""
    try:
        results = model(frame, conf=CONFIDENCE_THRESHOLD)
        detections = []
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                if box.cls[0] == 0:  # Person class
                    confidence = float(box.conf[0])
                    if confidence > CONFIDENCE_THRESHOLD:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        x1, y1, x2, y2 = add_padding((x1, y1, x2, y2), frame.shape)
                        cropped = frame[y1:y2, x1:x2]
                        if cropped.size > 0:
                            detection = Detection(
                                image=cropped,
                                box=(x1, y1, x2, y2),
                                confidence=confidence,
                                frame_number=frame_number
                            )
                            detections.append(detection)
        
        return detections
    except Exception as e:
        logger.error(f"Error processing frame: {str(e)}")
        return []

def detect_people(file_path: str) -> Tuple[List[Detection], str]:
    """
    Detect people in an image or video file
    
    Args:
        file_path: Path to the input file
        
    Returns:
        Tuple of (list of Detection objects, media_type string)
    """
    try:
        # Try to open as video first
        cap = cv2.VideoCapture(file_path)
        if cap.isOpened():
            logger.info("Processing video file")
            detections = []
            frame_count = 0
            
            while cap.isOpened() and frame_count < MAX_VIDEO_FRAMES:
                ret, frame = cap.read()
                if not ret:
                    break
                    
                frame_detections = process_frame(frame, frame_number=frame_count)
                detections.extend(frame_detections)
                frame_count += 1
            
            cap.release()
            return detections, "video"
        
        # If not video, try as image
        logger.info("Processing image file")
        image = cv2.imread(file_path)
        if image is None:
            raise ValueError("Failed to read file as image or video")
            
        detections = process_frame(image)
        return detections, "image"

    except Exception as e:
        logger.error(f"Error in detect_people: {str(e)}")
        raise 