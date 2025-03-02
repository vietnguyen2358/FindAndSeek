import OpenAI from "openai";
import type { DetectedPerson, DetectedPersonDetails } from "@shared/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FrameAnalysis {
  detectedPersons: DetectedPerson[];
  timestamp: string;
}

export class VideoProcessor {
  // Process a single frame
  static async processFrame(
    frameData: string,
    timestamp: string
  ): Promise<FrameAnalysis> {
    try {
      // First stage: Detect all people in the frame
      const detections = await this.detectPeopleInFrame(frameData);
      
      // Second stage: Analyze each detected person
      const analysisPromises = detections.map((detection, index) => 
        this.analyzeDetectedPerson(frameData, detection.bbox, index, timestamp)
      );
      
      const detectedPersons = await Promise.all(analysisPromises);
      
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

  // First stage: Detect people and get bounding boxes
  private static async detectPeopleInFrame(frameData: string): Promise<{
    bbox: [number, number, number, number];
    confidence: number;
  }[]> {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are a specialized computer vision system for detecting people in surveillance footage.
          For each person detected, provide:
          1. Precise bounding box coordinates [x, y, width, height] normalized between 0-1
          2. Detection confidence score between 0-1
          Return only a JSON array of detections.`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${frameData}` }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.detections || [];
  }

  // Second stage: Analyze each detected person
  private static async analyzeDetectedPerson(
    frameData: string,
    bbox: [number, number, number, number],
    personId: number,
    timestamp: string
  ): Promise<DetectedPerson> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: `Analyze this detected person and provide a detailed description in JSON format:
            {
              "description": "Brief one-line description",
              "details": {
                "age": "Estimated age range",
                "clothing": "Detailed clothing description",
                "environment": "Immediate surroundings and context",
                "movement": "Direction and type of movement",
                "distinctive_features": ["List of notable characteristics"]
              }
            }`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${frameData}` }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        id: personId,
        time: timestamp,
        description: analysis.description || "Person detected",
        confidence: bbox[4] || 0.8,
        thumbnail: frameData,
        bbox: bbox,
        details: analysis.details || {
          age: "Unknown",
          clothing: "Not visible",
          environment: "Not specified",
          movement: "Unknown",
          distinctive_features: []
        }
      };
    } catch (error) {
      console.error("Error analyzing person:", error);
      return {
        id: personId,
        time: timestamp,
        description: "Analysis failed",
        confidence: 0.5,
        thumbnail: frameData,
        bbox: bbox,
        details: {
          age: "Unknown",
          clothing: "Not visible",
          environment: "Not specified",
          movement: "Unknown",
          distinctive_features: []
        }
      };
    }
  }
}
