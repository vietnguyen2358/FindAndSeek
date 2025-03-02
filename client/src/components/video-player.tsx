import { useEffect, useRef } from "react";
import type { DetectedPerson } from "@shared/types";
import { cameraImages } from "@/lib/mockData";

interface VideoPlayerProps {
  showDetections?: boolean;
  onPersonsDetected?: (persons: DetectedPerson[]) => void;
  cameraId: number;
}

export function VideoPlayer({ 
  showDetections = true,
  onPersonsDetected,
  cameraId
}: VideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create a new image element
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      // Set canvas dimensions to match the image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        console.log('Analyzing image:', img.src);
        // Send the image URL for analysis
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
          const error = await response.json();
          console.error('Error from analyze-frame endpoint:', error);
          return;
        }

        const analysis = await response.json();
        console.log('Image analysis result:', analysis);

        // Send the analyzed persons data to parent component
        if (onPersonsDetected && analysis.detections) {
          const detectedPersons = analysis.detections.map((detection: any, index: number) => ({
            id: index + 1,
            time: new Date().toLocaleString(),
            description: detection.description,
            confidence: detection.confidence,
            details: detection.details
          }));
          onPersonsDetected(detectedPersons);
        }

      } catch (error) {
        console.error('Error analyzing image:', error);
      }
    };

    img.onerror = (error) => {
      console.error('Error loading image:', error);
    };

    // Load the test image
    const imageUrl = cameraImages[cameraId as keyof typeof cameraImages];
    console.log('Loading camera image:', imageUrl);
    img.src = imageUrl;

  }, [showDetections, onPersonsDetected, cameraId]);

  return (
    <div className="relative aspect-video w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-contain bg-black rounded-lg"
      />
    </div>
  );
}