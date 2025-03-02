import { useEffect, useRef } from "react";
import type { DetectedPerson } from "@shared/types";
import { cameraImages } from "@/lib/mockData";

interface VideoPlayerProps {
  detections?: {
    bbox: [number, number, number, number];
    confidence: number;
  }[];
  showDetections?: boolean;
  onPersonsDetected?: (persons: DetectedPerson[]) => void;
  cameraId: number;
}

export function VideoPlayer({ 
  detections = [], 
  showDetections = true,
  onPersonsDetected,
  cameraId
}: VideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create a new image element
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      // Draw the image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      imageRef.current = img;

      try {
        const response = await fetch('/api/analyze-frame', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageUrl: img.src,
            timestamp: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error('Failed to analyze frame');
        }

        const analysis = await response.json();

        if (showDetections && analysis.detections) {
          // Draw detection boxes
          analysis.detections.forEach(({ bbox, confidence }) => {
            const [x, y, width, height] = bbox;

            // Draw semi-transparent background
            ctx.fillStyle = `rgba(59, 130, 246, ${confidence * 0.2})`;
            ctx.fillRect(
              x * canvas.width,
              y * canvas.height,
              width * canvas.width,
              height * canvas.height
            );

            // Draw border
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              x * canvas.width,
              y * canvas.height,
              width * canvas.width,
              height * canvas.height
            );

            // Show confidence
            ctx.fillStyle = "white";
            ctx.font = "12px Arial";
            ctx.fillText(
              `${Math.round(confidence * 100)}%`,
              x * canvas.width,
              y * canvas.height - 5
            );
          });
        }

        // Send the analyzed persons data to parent component
        if (onPersonsDetected && analysis.detections) {
          onPersonsDetected(analysis.detections);
        }

      } catch (error) {
        console.error('Error analyzing frame:', error);
      }
    };

    // Use the camera image based on camera ID
    img.src = cameraImages[cameraId] || cameraImages[1];

  }, [showDetections, onPersonsDetected, cameraId]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      className="w-full h-full bg-black rounded-lg"
    />
  );
}