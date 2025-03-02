import * as torch from 'torch';
import { YOLO } from 'ultralytics';
import * as cv2 from 'opencv-python-headless';

// Singleton YOLO model instance with lazy loading
class YOLODetector {
  private static instance: YOLODetector;
  private model: YOLO | null = null;
  private modelLoadingPromise: Promise<YOLO> | null = null;

  private constructor() {}

  static getInstance(): YOLODetector {
    if (!YOLODetector.instance) {
      YOLODetector.instance = new YOLODetector();
    }
    return YOLODetector.instance;
  }

  private async initModel(): Promise<YOLO> {
    try {
      console.log('Initializing YOLO model...');
      const startTime = Date.now();
      const model = new YOLO('yolov8n.pt');
      console.log(`YOLO model initialized in ${Date.now() - startTime}ms`);
      return model;
    } catch (error) {
      console.error('Failed to initialize YOLO model:', error);
      throw new Error('Model initialization failed');
    }
  }

  async getModel(): Promise<YOLO> {
    if (this.model) return this.model;

    if (!this.modelLoadingPromise) {
      this.modelLoadingPromise = this.initModel().then(model => {
        this.model = model;
        return model;
      });
    }

    return this.modelLoadingPromise;
  }
}

// Image preprocessing with performance optimization
async function preprocessImage(imageBuffer: Buffer): Promise<any> {
  try {
    const startTime = Date.now();
    console.log('Starting image preprocessing...');

    // Decode image
    const nparr = Buffer.from(imageBuffer);
    const img = cv2.imdecode(nparr, cv2.IMREAD_COLOR);

    if (!img || !img.shape) {
      throw new Error('Invalid image data');
    }

    // Resize if too large (maintain aspect ratio)
    const maxSize = 1024;
    const [height, width] = [img.shape[0], img.shape[1]];

    let processedImg = img;
    if (Math.max(height, width) > maxSize) {
      const scale = maxSize / Math.max(height, width);
      const newSize = [Math.round(width * scale), Math.round(height * scale)];
      processedImg = cv2.resize(img, newSize, cv2.INTER_AREA);
    }

    console.log(`Image preprocessing completed in ${Date.now() - startTime}ms`);
    return processedImg;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    throw new Error('Failed to preprocess image: ' + error.message);
  }
}

export interface Detection {
  bbox: [number, number, number, number]; // normalized coordinates [x, y, width, height]
  confidence: number;
}

export async function detectPeople(imageBase64: string): Promise<Detection[]> {
  const startTime = Date.now();
  console.log('Starting person detection pipeline...');

  try {
    // Input validation
    if (!imageBase64) {
      throw new Error('No image data provided');
    }

    // Decode and preprocess image
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const imageArray = await preprocessImage(imageBuffer);

    // Get YOLO model instance
    const detector = YOLODetector.getInstance();
    const yolo = await detector.getModel();

    // Run detection with timeout
    console.log('Running YOLO detection...');
    const detectionStartTime = Date.now();

    const results = await Promise.race([
      yolo(imageArray, { conf: 0.25, iou: 0.45 }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Detection timeout')), 30000)
      )
    ]);

    console.log(`YOLO detection completed in ${Date.now() - detectionStartTime}ms`);

    // Process detections
    const detections: Detection[] = [];
    for (const detection of results[0].boxes) {
      if (detection.cls === 0) { // class 0 is person in COCO dataset
        const [x1, y1, x2, y2] = detection.xyxy[0];
        const width = x2 - x1;
        const height = y2 - y1;

        // Normalize coordinates
        const imgWidth = imageArray.shape[1];
        const imgHeight = imageArray.shape[0];

        detections.push({
          bbox: [
            x1 / imgWidth,
            y1 / imgHeight,
            width / imgWidth,
            height / imgHeight
          ],
          confidence: detection.conf
        });
      }
    }

    console.log(`Found ${detections.length} people in ${Date.now() - startTime}ms`);
    return detections;
  } catch (error) {
    console.error('Error in person detection pipeline:', error);
    return [];
  }
}

export function cropDetection(imageBase64: string, bbox: [number, number, number, number]): string {
  try {
    // Input validation
    if (!imageBase64 || !bbox || bbox.length !== 4) {
      throw new Error('Invalid input for cropping');
    }

    // Decode base64 image
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const image = cv2.imdecode(imageBuffer, cv2.IMREAD_COLOR);

    if (!image || !image.shape) {
      throw new Error('Invalid image data for cropping');
    }

    // Get image dimensions
    const [height, width] = [image.shape[0], image.shape[1]];

    // Convert normalized coordinates to pixel coordinates
    const [x, y, w, h] = bbox.map((coord, i) => {
      return i < 2 
        ? Math.floor(coord * (i % 2 === 0 ? width : height))
        : Math.ceil(coord * (i % 2 === 0 ? width : height));
    });

    // Add padding around the crop (10% of dimensions)
    const pad = {
      x: Math.floor(w * 0.1),
      y: Math.floor(h * 0.1)
    };

    // Ensure crop coordinates are within image bounds
    const crop = {
      x: Math.max(0, x - pad.x),
      y: Math.max(0, y - pad.y),
      width: Math.min(width - x, w + 2 * pad.x),
      height: Math.min(height - y, h + 2 * pad.y)
    };

    // Crop image
    const cropped = image.slice(
      crop.y, 
      crop.y + crop.height,
      crop.x,
      crop.x + crop.width
    );

    // Encode back to base64
    const encoded = cv2.imencode('.jpg', cropped);
    return encoded.toString('base64');
  } catch (error) {
    console.error('Error cropping detection:', error);
    return imageBase64; // Return original image if cropping fails
  }
}