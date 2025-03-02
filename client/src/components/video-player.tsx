import { useEffect, useRef, useState } from "react";
import type { DetectedPerson } from "@shared/types";
import { cameraImages, cameraFeeds } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";

interface VideoPlayerProps {
  showDetections?: boolean;
  onPersonsDetected?: (persons: DetectedPerson[]) => void;
  cameraId: number;
  searchResults?: DetectedPerson[];
}

export function VideoPlayer({ 
  showDetections = true,
  onPersonsDetected,
  cameraId,
  searchResults = []
}: VideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
        setIsProcessing(true);
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

            // Check if this detection matches any search results
            const matchingResult = searchResults.find(result => 
              result.description === detection.description
            );

            // Use different colors for matched vs unmatched detections
            const color = matchingResult ? '#22c55e' : '#3b82f6';
            const alpha = matchingResult ? 0.3 : 0.2;

            // Draw semi-transparent background
            ctx.fillStyle = `rgba(${color.slice(1).match(/.{2}/g)?.map(x => parseInt(x, 16)).join(',')}, ${alpha})`;
            ctx.fillRect(
              x * canvas.width,
              y * canvas.height,
              width * canvas.width,
              height * canvas.height
            );

            // Draw box
            ctx.strokeStyle = color;
            ctx.lineWidth = matchingResult ? 3 : 2;
            ctx.strokeRect(
              x * canvas.width,
              y * canvas.height,
              width * canvas.width,
              height * canvas.height
            );

            // Show confidence and description
            ctx.fillStyle = "white";
            ctx.font = matchingResult ? "bold 16px Arial" : "16px Arial";

            // Draw text background for better readability
            const text = `${Math.round(confidence * 100)}% - ${detection.description}`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(
              x * canvas.width,
              y * canvas.height - 25,
              textWidth + 10,
              25
            );

            // Draw text
            ctx.fillStyle = "white";
            ctx.fillText(
              text,
              x * canvas.width + 5,
              y * canvas.height - 5
            );

            // If it's a match, add a "MATCH" badge
            if (matchingResult) {
              const matchScore = Math.round((matchingResult.matchScore || 0) * 100);
              ctx.fillStyle = '#22c55e';
              ctx.fillRect(
                x * canvas.width,
                y * canvas.height - 45,
                90,
                20
              );
              ctx.fillStyle = "white";
              ctx.font = "bold 12px Arial";
              ctx.fillText(
                `${matchScore}% MATCH`,
                x * canvas.width + 5,
                y * canvas.height - 30
              );
            }
          });
        }

        // Send the analyzed persons data to parent component
        if (onPersonsDetected && analysis.detections) {
          const detectedPersons = analysis.detections.map((detection: any, index: number) => ({
            id: index + 1,
            cameraId,
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
      } finally {
        setIsProcessing(false);
      }
    };

    img.onerror = (error) => {
      console.error('Error loading image:', error);
      setIsProcessing(false);
    };

    // Load the camera image
    const imageUrl = cameraImages[cameraId as keyof typeof cameraImages];
    console.log('Loading camera image:', imageUrl);
    img.src = imageUrl;

  }, [showDetections, onPersonsDetected, cameraId, searchResults]);

  return (
    <div className="relative aspect-video w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-contain bg-black rounded-lg"
      />
      {isProcessing && (
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 animate-pulse"
        >
          Processing...
        </Badge>
      )}
    </div>
  );
}