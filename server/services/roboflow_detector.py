```python
from inference_sdk import InferenceHTTPClient
import sys
import json
import base64

def detect_people(base64_image):
    try:
        client = InferenceHTTPClient(
            api_url="https://detect.roboflow.com",
            api_key="3RyAsQaKrfI80jA1oi9Z"
        )

        result = client.run_workflow(
            workspace_name="mizantech-bww5d",
            workflow_id="detect-count-and-visualize",
            images={
                "image": base64_image
            },
            use_cache=True
        )

        # Extract predictions and normalize coordinates
        detections = []
        for pred in result.predictions:
            if pred.get('class') == 'person':
                x = pred['x'] / result['image']['width']
                y = pred['y'] / result['image']['height']
                width = pred['width'] / result['image']['width']
                height = pred['height'] / result['image']['height']
                
                detections.append({
                    'bbox': [x, y, width, height],
                    'confidence': pred['confidence']
                })

        return {'success': True, 'detections': detections}
    except Exception as e:
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    # Read base64 image data from stdin
    base64_image = sys.stdin.read().strip()
    result = detect_people(base64_image)
    print(json.dumps(result))
```
