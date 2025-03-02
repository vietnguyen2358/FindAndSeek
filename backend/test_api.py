import requests
import os
import sys

# Get the base URL from command line argument or use default
base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"

# Test the root endpoint
def test_root():
    response = requests.get(f"{base_url}/")
    print(f"Root endpoint: {response.status_code}")
    print(response.json())
    print()

# Test the analyze image endpoint
def test_analyze_image(image_path):
    if not os.path.exists(image_path):
        print(f"Error: Image file not found: {image_path}")
        return
    
    with open(image_path, "rb") as img_file:
        files = {"file": (os.path.basename(image_path), img_file, "image/jpeg")}
        response = requests.post(f"{base_url}/api/analyzeimage", files=files)
        
        print(f"Analyze image endpoint: {response.status_code}")
        print(response.json())
        print()

# Test the compare images endpoint
def test_compare_images(missing_person_path, search_image_path):
    missing_exists = os.path.exists(missing_person_path)
    search_exists = os.path.exists(search_image_path)
    
    if not missing_exists:
        print(f"Error: Missing person image not found: {missing_person_path}")
    if not search_exists:
        print(f"Error: Search image not found: {search_image_path}")
    if not missing_exists or not search_exists:
        return
    
    with open(missing_person_path, "rb") as missing_file, open(search_image_path, "rb") as search_file:
        files = {
            "missing_person_image": (os.path.basename(missing_person_path), missing_file, "image/jpeg"),
            "search_image": (os.path.basename(search_image_path), search_file, "image/jpeg")
        }
        response = requests.post(f"{base_url}/api/compare-images", files=files)
        
        print(f"Compare images endpoint: {response.status_code}")
        print(response.json())
        print()

if __name__ == "__main__":
    print("Testing the FindAndSeek API...")
    
    # Test the root endpoint
    test_root()
    
    # Check if test images exist
    test_image_dir = "test_images"
    os.makedirs(test_image_dir, exist_ok=True)
    
    test_image = os.path.join(test_image_dir, "test.jpg")
    missing_person_image = os.path.join(test_image_dir, "missing_person.jpg")
    search_image = os.path.join(test_image_dir, "search.jpg")
    
    # If test images don't exist, notify the user
    if not os.path.exists(test_image):
        print(f"Note: To test the analyze image endpoint, save an image as {test_image}")
    if not os.path.exists(missing_person_image) or not os.path.exists(search_image):
        print(f"Note: To test the compare images endpoint, save images as {missing_person_image} and {search_image}")
    
    # Test endpoints if images exist
    if os.path.exists(test_image):
        test_analyze_image(test_image)
    
    if os.path.exists(missing_person_image) and os.path.exists(search_image):
        test_compare_images(missing_person_image, search_image)
    
    print("API testing completed!") 