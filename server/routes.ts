import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertCaseSchema, insertCameraFootageSchema } from "@shared/schema";
import { z } from "zod";
import type { DetectedPerson } from "@shared/types";
import OpenAI from "openai";
import { findSimilarDetections } from "./services/similarity-search";
import fetch from "node-fetch";
import multer from 'multer';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to get similarity score between search criteria and a detection
async function getSimilarityScore(query: string, detection: DetectedPerson): Promise<number> {
  try {
    const detectionInfo = {
      description: detection.description,
      clothing: detection.details.clothing,
      features: detection.details.distinctive_features,
      location: detection.details.environment
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Compare the search query with the detected person's details. Return a JSON number between 0 and 1 indicating how well they match based on clothing and physical description. Example: {"score": 0.85}`
        },
        {
          role: "user",
          content: `Search description: "${query}"
Person detected: ${JSON.stringify(detectionInfo, null, 2)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.score || 0;
  } catch (error) {
    console.error("Error getting similarity score:", error);
    return 0;
  }
}

// Function to interact with Groq AI
async function getGroqResponse(prompt: string, systemMessage: string = ""): Promise<string> {
  try {
    const response = await fetch('https://api.groq.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          ...(systemMessage ? [{
            role: "system",
            content: systemMessage
          }] : []),
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const result = await response.json() as { choices: Array<{ message: { content: string } }> };
    return result.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Groq API:', error);
    throw error;
  }
}

export async function registerRoutes(app: Express) {
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
        // Get AI analysis of the matches using Groq
        const analysisPrompt = `Search Query: "${query}"
Detected persons:
${detections.map(d => `- ${d.description} wearing ${d.details.clothing} at ${d.details.environment}`).join('\n')}

Analyze these detections in relation to the search query. For each detection:
1. Assess how well it matches the search criteria
2. Note any distinctive features that might be relevant
3. Consider the location and timing

Provide a concise analysis with confidence levels.`;

        const systemMessage = `You are an AI assistant specializing in missing persons searches and surveillance analysis. 
Focus on:
- Matching physical descriptions and clothing
- Analyzing movement patterns
- Identifying key locations
- Assessing timing of sightings

Be precise but compassionate in your responses.`;

        const analysis = await getGroqResponse(analysisPrompt, systemMessage);

        // Get similarity scores and rank the matches
        const scoredDetections = await Promise.all(
          detections.map(async (detection) => {
            const similarityPrompt = `Compare these two descriptions and rate their similarity from 0 to 1:

Search: "${query}"
Detection: Person wearing ${detection.details.clothing}, described as ${detection.description}, seen at ${detection.details.environment}

Return only a number between 0 and 1.`;

            const scoreText = await getGroqResponse(similarityPrompt);
            const score = Math.min(1, Math.max(0, parseFloat(scoreText) || 0));

            return {
              detection,
              score
            };
          })
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

        res.json({
          matches: topMatches,
          analysis: analysis.split('\n')
        });

      } else {
        const noMatchesResponse = await getGroqResponse(
          `The search query was: "${query}" but no matching persons were detected in the current camera feeds. 
          Provide a helpful response that acknowledges this and suggests what to look out for.`,
          "You are a helpful AI assistant for a missing persons search system. Be informative but sensitive in your responses."
        );

        res.json({
          matches: [],
          analysis: [noMatchesResponse]
        });
      }

    } catch (error) {
      console.error("Search error:", error);
      res.status(400).json({
        error: error.message,
        matches: [],
        analysis: ['Error processing search']
      });
    }
  });

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

      // Return both the raw transcription and processed response
      res.json({ 
        text: transcription.text,
        processed: processedDescription
      });
    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({ error: 'Failed to process audio' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

export {};