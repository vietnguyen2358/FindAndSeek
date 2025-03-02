import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export class ObjectDetector {
  private static model: cocoSsd.ObjectDetection | null = null;

  static async initialize() {
    if (!this.model) {
      this.model = await cocoSsd.load();
    }
    return this.model;
  }

  static async detectPeople(imageElement: HTMLImageElement): Promise<{
    bbox: [number, number, number, number];
    confidence: number;
  }[]> {
    try {
      const model = await this.initialize();
      const predictions = await model.detect(imageElement);

      // Filter for person detections and normalize bounding boxes
      return predictions
        .filter(pred => pred.class === 'person')
        .map(pred => ({
          // Convert to normalized coordinates [x, y, width, height]
          bbox: [
            pred.bbox[0] / imageElement.width,
            pred.bbox[1] / imageElement.height,
            pred.bbox[2] / imageElement.width,
            pred.bbox[3] / imageElement.height
          ] as [number, number, number, number],
          confidence: pred.score
        }));
    } catch (error) {
      console.error('Error detecting people:', error);
      return [];
    }
  }

  static cropDetection(
    canvas: HTMLCanvasElement,
    bbox: [number, number, number, number]
  ): string {
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const [x, y, width, height] = bbox;
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return '';

    // Set dimensions for cropped canvas
    cropCanvas.width = width * canvas.width;
    cropCanvas.height = height * canvas.height;

    // Draw the cropped portion
    cropCtx.drawImage(
      canvas,
      x * canvas.width,
      y * canvas.height,
      width * canvas.width,
      height * canvas.height,
      0,
      0,
      cropCanvas.width,
      cropCanvas.height
    );

    return cropCanvas.toDataURL('image/jpeg');
  }
}
