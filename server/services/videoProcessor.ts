import type { DetectedPerson, DetectedPersonDetails } from "@shared/types";
import { analyzeImage } from "./ai";

export class VideoProcessor {
  // Process a single frame
  static async processFrame(
    frameData: string,
    timestamp: string
  ): Promise<{
    detectedPersons: DetectedPerson[];
    timestamp: string;
  }> {
    try {
      // Use our AI service to analyze the frame
      const analysis = await analyzeImage(frameData);

      // Convert the analysis results to DetectedPerson format
      const detectedPersons = analysis.detections.map((detection, index) => ({
        id: index + 1,
        time: timestamp,
        description: detection.description,
        confidence: detection.confidence,
        thumbnail: frameData, // We're using the full frame as thumbnail for now
        bbox: detection.bbox,
        details: detection.details
      }));

      return {
        detectedPersons,
        timestamp
      };
    } catch (error) {
      console.error("Error processing frame:", error);
      return {
        detectedPersons: [],
        timestamp
      };
    }
  }
}