"""
Simple test script to verify that the compare_utils functions work correctly
without needing to start a server.
"""

import os
from app.compare_utils import analyze_missing_person, detect_people_in_search_image, compare_with_groq
import json

def run_test():
    """Run a simple test of the functions in compare_utils."""
    print("Testing image comparison functions...")
    
    # Check if test images exist
    test_image_dir = "test_images"
    os.makedirs(test_image_dir, exist_ok=True)
    
    missing_person_image = os.path.join(test_image_dir, "missing_person.jpg")
    search_image = os.path.join(test_image_dir, "search.jpg")
    
    # If test images don't exist, notify the user
    if not os.path.exists(missing_person_image):
        print(f"Note: Please save a test image as {missing_person_image}")
    if not os.path.exists(search_image):
        print(f"Note: Please save a test image as {search_image}")
    
    # Skip the test if either image is missing
    if not os.path.exists(missing_person_image) or not os.path.exists(search_image):
        print("Skipping test: Missing test images")
        return
    
    try:
        # Test analyze_missing_person
        print("\nTesting analyze_missing_person function...")
        with open(missing_person_image, "rb") as img_file:
            missing_person_data = analyze_missing_person(img_file.read())
        print(json.dumps(missing_person_data, indent=2))
        
        # Test detect_people_in_search_image
        print("\nTesting detect_people_in_search_image function...")
        with open(search_image, "rb") as img_file:
            search_people_data = detect_people_in_search_image(img_file.read())
        print(json.dumps(search_people_data, indent=2))
        
        # Test compare_with_groq
        print("\nTesting compare_with_groq function...")
        comparison_data = compare_with_groq(missing_person_data, search_people_data)
        print(json.dumps(comparison_data, indent=2))
        
        print("\nAll tests completed successfully!")
        
    except Exception as e:
        print(f"Error during test: {str(e)}")
        raise

if __name__ == "__main__":
    run_test() 