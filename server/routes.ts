import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCaseSchema, insertCameraFootageSchema } from "@shared/schema";
import { analyzeReport, analyzeImage, predictMovement } from "./services/ai";
import { z } from "zod";
import type { SearchFilter } from "@shared/types";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/cases", async (req, res) => {
    try {
      const caseData = insertCaseSchema.parse(req.body);
      let newCase = await storage.createCase(caseData);

      // Perform AI analysis on the case description
      const analysis = await analyzeReport(caseData.description);
      newCase = await storage.updateCaseAIAnalysis(newCase.id, analysis);

      // If we have a last known location, calculate initial search radius
      if (caseData.lastLocation) {
        const prediction = await predictMovement(
          { lat: 0, lng: 0 }, // TODO: Geocode the lastLocation string to coordinates
          0, // Initial time elapsed
          "walking"
        );
        newCase = await storage.updateCaseSearchRadius(newCase.id, prediction);
      }

      res.json(newCase);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/cases", async (_req, res) => {
    const cases = await storage.getAllCases();
    res.json(cases);
  });

  app.get("/api/cases/:id", async (req, res) => {
    const caseId = parseInt(req.params.id);
    const caseData = await storage.getCase(caseId);
    if (!caseData) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    res.json(caseData);
  });

  app.patch("/api/cases/:id", async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const updatedCase = await storage.updateCase(caseId, req.body);
      res.json(updatedCase);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/cases/:id/analyze-image", async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const schema = z.object({ image: z.string() });
      const { image } = schema.parse(req.body);

      const analysis = await analyzeImage(image);
      const case_ = await storage.getCase(caseId);

      if (!case_) {
        throw new Error("Case not found");
      }

      // Add the image to the case
      const updatedCase = await storage.updateCase(caseId, {
        images: [...case_.images, image]
      });

      // Add a timeline event for the image analysis
      await storage.addTimelineEvent(caseId, {
        time: new Date().toISOString(),
        event: "Image analyzed",
        details: analysis
      });

      res.json({ analysis, case: updatedCase });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/footage", async (req, res) => {
    try {
      const footageData = insertCameraFootageSchema.parse(req.body);
      const newFootage = await storage.addCameraFootage(footageData);

      // Process the footage with AI
      const analysis = await analyzeImage(footageData.footage);
      const processedFootage = await storage.updateFootageAnalysis(newFootage.id, {
        ...analysis,
        processedAt: new Date().toISOString()
      });

      // Add a timeline event for the new footage
      await storage.addTimelineEvent(footageData.caseId, {
        time: new Date().toISOString(),
        event: "New camera footage processed",
        details: {
          footageId: newFootage.id,
          location: footageData.location,
          detections: analysis.detections.length
        }
      });

      res.json(processedFootage);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/cases/:id/footage", async (req, res) => {
    const caseId = parseInt(req.params.id);
    const footage = await storage.getCaseFootage(caseId);
    res.json(footage);
  });

  app.post("/api/cases/:id/predict-movement", async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const schema = z.object({
        lat: z.number(),
        lng: z.number(),
        timeElapsed: z.number(),
        transportMode: z.enum(["walking", "vehicle"])
      });

      const data = schema.parse(req.body);
      const prediction = await predictMovement(
        { lat: data.lat, lng: data.lng },
        data.timeElapsed,
        data.transportMode
      );

      const updatedCase = await storage.updateCaseSearchRadius(caseId, prediction);

      // Add a timeline event for the prediction update
      await storage.addTimelineEvent(caseId, {
        time: new Date().toISOString(),
        event: "Search radius updated",
        details: {
          radius: prediction.radius,
          transportMode: data.transportMode
        }
      });

      res.json({ prediction, case: updatedCase });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/analyze-frame", async (req, res) => {
    try {
      console.log('Received analyze-frame request:', req.body);

      const schema = z.object({
        imageUrl: z.string(),
        timestamp: z.string()
      });

      const { imageUrl, timestamp } = schema.parse(req.body);
      console.log('Parsed request data:', { imageUrl, timestamp });

      // Use our AI service to analyze the frame
      const analysis = await analyzeImage(imageUrl);
      console.log('Analysis completed:', {
        detectionCount: analysis.detections.length,
        summary: analysis.summary
      });

      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing frame:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Updated search parsing endpoint to use ChatGPT
  app.post("/api/parse-search", async (req, res) => {
    try {
      console.log('Received search parsing request:', req.body);

      const schema = z.object({
        query: z.string()
      });

      const { query } = schema.parse(req.body);

      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant helping to find missing persons. Analyze user queries and help extract relevant information.

When users provide descriptions, respond in this format:
{
  "filters": [
    {"category": "clothing", "value": "specific clothing item or color"},
    {"category": "physical", "value": "physical description"},
    {"category": "location", "value": "location mentioned"},
    {"category": "time", "value": "time or timeframe mentioned"},
    {"category": "age", "value": "age or age range"},
    {"category": "action", "value": "what the person was doing"}
  ],
  "response": "Natural language response about what you understood",
  "suggestions": ["Suggested follow-up questions or additional details to ask"]
}

Break down complex descriptions into specific search criteria. Be precise and thorough.`
          },
          {
            role: "user",
            content: query
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      console.log('Parsed search filters:', result);
      res.json(result);
    } catch (error: any) {
      console.error("Error parsing search query:", error);
      res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}