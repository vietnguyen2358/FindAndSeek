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
          throw new Error('Failed to analyze frame');
        }

        const analysis = await response.json();
        console.log('Image analysis result:', analysis);

        if (showDetections && analysis.detections) {
          // Draw detection boxes
          analysis.detections.forEach((detection: any) => {
            const [x, y, width, height] = detection.bbox || [0, 0, 0, 0];
            const confidence = detection.confidence || 0;

            // Draw semi-transparent background
            ctx.fillStyle = `rgba(59, 130, 246, ${confidence * 0.2})`;
            ctx.fillRect(
              x * canvas.width,
              y * canvas.height,
              width * canvas.width,
              height * canvas.height
            );

            // Draw box
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              x * canvas.width,
              y * canvas.height,
              width * canvas.width,
              height * canvas.height
            );

            // Show confidence and description
            ctx.fillStyle = "white";
            ctx.font = "16px Arial";
            ctx.fillText(
              `${Math.round(confidence * 100)}% - ${detection.description}`,
              x * canvas.width,
              y * canvas.height - 5
            );
          });
        }

        // Send the analyzed persons data to parent component
        if (onPersonsDetected && analysis.detections) {
          const detectedPersons = analysis.detections.map((detection: any, index: number) => ({
            id: index + 1,
            time: new Date().toLocaleString(),
            description: detection.description,
            confidence: detection.confidence,
            thumbnail: img.src,
            bbox: detection.bbox || [0, 0, 0, 0],
            details: detection.details || {
              age: "Unknown",
              clothing: "Not specified",
              environment: "Not specified",
              movement: "Not specified",
              distinctive_features: []
            }
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