import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertCaseSchema, insertCameraFootageSchema } from "@shared/schema";
import { z } from "zod";
import type { SearchFilter, DetectedPerson, SearchCriteria } from "@shared/types";
import OpenAI from "openai";
import { findSimilarDetections, analyzeClothingDescription } from "./services/similarity-search";
import fetch from "node-fetch";
import multer from 'multer';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

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

  app.post("/api/parse-search", async (req, res) => {
    try {
      console.log('Received search request:', req.body);

      const schema = z.object({
        query: z.string(),
        detections: z.array(z.any()).optional()
      });

      const { query, detections = [] } = schema.parse(req.body);

      if (detections.length > 0) {
        // Get similarity scores for each detection
        const scoredDetections = await Promise.all(
          detections.map(async (detection) => ({
            detection,
            score: await getSimilarityScore(query, detection)
          }))
        );

        // Sort by score and get top matches
        const topMatches = scoredDetections
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(({ detection, score }) => ({
            id: detection.id,
            description: detection.description,
            time: detection.time,
            location: detection.details.environment,
            details: detection.details,
            thumbnail: detection.thumbnail,
            matchScore: score
          }));

        // Get brief match analysis
        const analysis = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "Provide very brief match explanations focusing on clothing and distinctive features. One line per match."
            },
            {
              role: "user",
              content: `Search: "${query}"
Matches: ${topMatches.map(match =>
                `${match.description} wearing ${match.details.clothing}`
              ).join('\n')}`
            }
          ]
        });

        res.json({
          matches: topMatches,
          analysis: analysis.choices[0].message.content?.split('\n')
        });
      } else {
        res.json({
          matches: [],
          analysis: ['No detections to analyze']
        });
      }

    } catch (error: any) {
      console.error("Search error:", error);
      res.status(400).json({
        error: error.message,
        matches: [],
        analysis: ['Error processing search']
      });
    }
  });


  // Enhanced transcription route for real-time processing
  app.post("/api/transcribe", upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        throw new Error('No audio file received');
      }

      // Use Whisper for quick transcription
      const transcription = await openai.audio.transcriptions.create({
        file: req.file.buffer,
        model: "whisper-1",
      });

      if (!transcription.text.trim()) {
        return res.json({ text: '' });
      }

      // Process with Groq AI for real-time understanding
      const response = await fetch('https://api.groq.com/v1/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: [
            {
              role: "system",
              content: `You are helping to find missing persons. Extract key details from the voice description to search for matches. 
              Focus on:
              - Clothing description
              - Physical characteristics
              - Last known location
              - Time last seen
              - Any distinctive features

              Format your response in a clear, conversational way, highlighting the most important details for search.`
            },
            {
              role: "user",
              content: transcription.text
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const groqResponse = await response.json() as { choices: Array<{ message: { content: string } }> };
      const processedDescription = groqResponse.choices[0].message.content;

      res.json({ text: processedDescription });
    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({ error: 'Failed to process audio' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

export {};