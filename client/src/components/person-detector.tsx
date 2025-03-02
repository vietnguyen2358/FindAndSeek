import { useEffect, useRef, useState } from "react";
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function PersonDetector() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detections, setDetections] = useState<Array<{
    bbox: [number, number, number, number];
    class: string;
    score: number;
  }>>([]);

  useEffect(() => {
    const detectPeople = async () => {
      try {
        // Initialize TensorFlow.js backend
        if (!tf.getBackend()) {
          // Try WebGL first
          try {
            await tf.setBackend('webgl');
            await tf.ready();
            console.log('TensorFlow.js initialized with WebGL backend');
          } catch (e) {
            // Fallback to CPU if WebGL fails
            console.log('WebGL initialization failed, falling back to CPU');
            await tf.setBackend('cpu');
            await tf.ready();
            console.log('TensorFlow.js initialized with CPU backend');
          }
        }

        console.log('Using TensorFlow.js backend:', tf.getBackend());

        // Load the model
        const model = await cocoSsd.load();
        console.log('COCO-SSD model loaded successfully');

        // Create and load the image
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = "https://media.gettyimages.com/id/1459839633/photo/people-walking-across-crosswalk-in-city-downtown-top-view.jpg?s=612x612&w=gi&k=20&c=U2wnD0_EEZDO2xT62DAR4HexIsjBThPwOpykkabEKOU=";

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('Failed to load image'));
        });

        // Get canvas context
        if (!canvasRef.current) {
          throw new Error("Canvas element not mounted");
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to get 2D context");
        }

        // Draw the image
        console.log('Drawing image to canvas');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Run detection
        console.log('Running person detection...');
        const predictions = await model.detect(canvas);
        console.log('Detection complete:', predictions);

        // Filter for people only
        const peopleDetections = predictions
          .filter(pred => pred.class === 'person')
          .map(pred => ({
            bbox: pred.bbox,
            class: pred.class,
            score: pred.score
          }));

        setDetections(peopleDetections);

        // Draw bounding boxes
        peopleDetections.forEach(detection => {
          const [x, y, width, height] = detection.bbox;

          // Draw semi-transparent background
          ctx.fillStyle = `rgba(59, 130, 246, ${detection.score * 0.2})`;
          ctx.fillRect(x, y, width, height);

          // Draw box
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);

          // Draw label
          ctx.fillStyle = 'white';
          ctx.font = '16px Arial';
          ctx.fillText(
            `Person: ${Math.round(detection.score * 100)}%`,
            x,
            y > 20 ? y - 5 : y + 20
          );
        });

        console.log(`Detected ${peopleDetections.length} people`);
        setIsLoading(false);

      } catch (error) {
        console.error('Detection error:', error);
        setError(error instanceof Error ? error.message : 'Failed to detect people');
        setIsLoading(false);
      }
    };

    // Only run detection if canvas is mounted
    if (canvasRef.current) {
      detectPeople();
    }
  }, []);

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-red-500">
          <h3 className="font-medium mb-2">Error</h3>
          <p>{error}</p>
          <p className="text-sm mt-2">Try refreshing the page or check if your browser supports WebGL.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Person Detection Test</h2>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p>Loading model and processing image...</p>
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            width={612}
            height={612}
            className="border border-border rounded-lg"
          />
          <div className="mt-4">
            <h3 className="font-medium mb-2">Detections:</h3>
            <ul className="space-y-2">
              {detections.map((detection, index) => (
                <li key={index} className="text-sm">
                  Person {index + 1}: {Math.round(detection.score * 100)}% confidence
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Card>
  );
}