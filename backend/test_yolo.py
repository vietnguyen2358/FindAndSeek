import cv2
from yolo import detect_and_crop_people
import os

def test_yolo():
    # Test image path - replace with your test image
    test_image = "test.jpg"  # Put a test image in your backend directory
    
    if not os.path.exists(test_image):
        print(f"Please place a test image named {test_image} in the backend directory")
        return
    
    # Run detection
    cropped_images = detect_and_crop_people(test_image)
    
    # Display results
    print(f"Found {len(cropped_images)} people")
    
    # Save cropped images
    for i, img in enumerate(cropped_images):
        output_path = f"person_{i}.jpg"
        cv2.imwrite(output_path, img)
        print(f"Saved {output_path}")

if __name__ == "__main__":
    test_yolo() 