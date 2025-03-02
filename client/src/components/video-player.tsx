import { useEffect, useRef, useState } from "react";
import { mockVideoFrames } from "@/lib/mockData";
import type { DetectedPerson } from "@shared/types";
import { apiRequest } from "@/lib/queryClient";

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
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Process frame and get AI analysis
  const processFrame = async (frameData: string, timestamp: string) => {
    try {
      setIsProcessing(true);
      const response = await apiRequest<{ detectedPersons: DetectedPerson[] }>({
        url: "/api/analyze-frame",
        method: "POST",
        data: { frameData, timestamp }
      });

      if (response.detectedPersons && onPersonsDetected) {
        onPersonsDetected(response.detectedPersons);
      }
    } catch (error) {
      console.error("Error processing frame:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    const frameSource = mockVideoFrames[currentFrame];

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // For the first frame (real image), process it with AI
      if (currentFrame === 0 && !isProcessing) {
        const frameData = canvas.toDataURL("image/jpeg").split(",")[1];
        processFrame(frameData, new Date().toISOString());
      }

      if (showDetections) {
        detections.forEach(({ bbox, confidence }) => {
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
    };

    img.src = frameSource;

    const interval = setInterval(() => {
      if (isPlaying) {
        setCurrentFrame((prev) => (prev + 1) % mockVideoFrames.length);
      }
    }, 1000 / 30); // 30fps

    return () => clearInterval(interval);
  }, [currentFrame, detections, isPlaying, showDetections, isProcessing]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      className="w-full h-full bg-black rounded-lg"
    />
  );
}