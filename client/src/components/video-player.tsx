import { useEffect, useRef } from "react";
import type { DetectedPerson } from "@shared/types";
import { ObjectDetector } from "@/lib/objectDetection";

interface VideoPlayerProps {
  detections?: {
    bbox: [number, number, number, number];
    confidence: number;
  }[];
  showDetections?: boolean;
  onPersonsDetected?: (persons: DetectedPerson[]) => void;
}

export function VideoPlayer({ 
  detections = [], 
  showDetections = true,
  onPersonsDetected 
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

      // Detect people using TensorFlow
      const detectedPeople = await ObjectDetector.detectPeople(img);

      if (showDetections) {
        // Draw detection boxes
        detectedPeople.forEach(({ bbox, confidence }) => {
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
          ctx.strokeStyle = `rgba(59, 130, 246, ${confidence})`;
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

      // For each detection, crop the image and send to backend for analysis
      if (onPersonsDetected) {
        const peopleWithCrops = detectedPeople.map((detection, index) => ({
          id: index + 1,
          time: new Date().toLocaleString(),
          description: "Person detected",
          confidence: detection.confidence,
          bbox: detection.bbox,
          thumbnail: ObjectDetector.cropDetection(canvas, detection.bbox),
          details: {
            age: "Analyzing...",
            clothing: "Analyzing...",
            environment: "Analyzing...",
            movement: "Analyzing...",
            distinctive_features: []
          }
        }));

        onPersonsDetected(peopleWithCrops);
      }
    };

    // Use the crosswalk image
    img.src = "https://media.gettyimages.com/id/1459839633/photo/people-walking-across-crosswalk-in-city-downtown-top-view.jpg?s=612x612&w=gi&k=20&c=U2wnD0_EEZDO2xT62DAR4HexIsjBThPwOpykkabEKOU=";

  }, [showDetections, onPersonsDetected]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      className="w-full h-full bg-black rounded-lg"
    />
  );
}