import { useEffect, useRef, useState } from "react";
import { mockVideoFrames } from "@/lib/mockData";

interface VideoPlayerProps {
  detections?: {
    bbox: [number, number, number, number];
    confidence: number;
  }[];
  showDetections?: boolean;
}

export function VideoPlayer({ detections = [], showDetections = true }: VideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = mockVideoFrames[currentFrame];
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (showDetections) {
        detections.forEach(({ bbox, confidence }) => {
          const [x, y, width, height] = bbox;
          ctx.strokeStyle = `rgba(59, 130, 246, ${confidence})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(
            x * canvas.width,
            y * canvas.height,
            width * canvas.width,
            height * canvas.height
          );
        });
      }
    };

    const interval = setInterval(() => {
      if (isPlaying) {
        setCurrentFrame((prev) => (prev + 1) % mockVideoFrames.length);
      }
    }, 1000 / 30); // 30fps

    return () => clearInterval(interval);
  }, [currentFrame, detections, isPlaying, showDetections]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      className="w-full h-full bg-black rounded-lg"
    />
  );
}
