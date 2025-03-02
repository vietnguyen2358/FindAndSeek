import type { Express, Request, Response } from "express";
import { createServer } from "http";
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express) {
  const server = createServer(app);

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", mode: "simplified" });
  });

  // Mock cases endpoint
  app.get("/api/cases", (_req, res) => {
    res.json([
      {
        id: 1,
        title: "Missing Person - John Doe",
        description: "Last seen at Central Park on June 10th",
        lastLocation: "Central Park, New York",
        status: "active",
        createdAt: new Date().toISOString(),
        images: ["https://example.com/person1.jpg"],
        lastSighting: new Date().toISOString(),
        transportMode: "walking",
      },
      {
        id: 2,
        title: "Missing Person - Jane Smith",
        description: "Last seen at Downtown Mall on June 12th",
        lastLocation: "Downtown Mall, New York",
        status: "active",
        createdAt: new Date().toISOString(),
        images: ["https://example.com/person2.jpg"],
        lastSighting: new Date().toISOString(),
        transportMode: "car",
      }
    ]);
  });

  // Mock case by ID endpoint
  app.get("/api/cases/:id", (req, res) => {
    const id = parseInt(req.params.id);
    res.json({
      id,
      title: "Missing Person - John Doe",
      description: "Last seen at Central Park on June 10th",
      lastLocation: "Central Park, New York",
      status: "active",
      createdAt: new Date().toISOString(),
      images: ["https://example.com/person1.jpg"],
      lastSighting: new Date().toISOString(),
      transportMode: "walking",
      timeline: [
        { timestamp: new Date().toISOString(), event: "Initial report filed" },
        { timestamp: new Date().toISOString(), event: "Search team dispatched" }
      ],
      aiAnalysis: {
        entities: ["male", "adult", "red shirt", "blue jeans"],
        locations: ["Central Park", "Upper East Side"],
        timestamps: [new Date().toISOString()],
        confidence: 0.85
      },
      searchRadius: {
        radius: 5,
        probableLocations: ["Central Park West", "5th Avenue"]
      }
    });
  });

  // Camera footage endpoint
  app.get("/api/camera-footage", (_req, res) => {
    const cameras = [];
    
    // Try to load camera data from JSON files
    for (let i = 1; i <= 4; i++) {
      try {
        const jsonPath = path.join(process.cwd(), 'public', 'images', 'cameras', `camera${i}.json`);
        if (fs.existsSync(jsonPath)) {
          const cameraData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          cameras.push(cameraData);
        }
      } catch (error) {
        console.error(`Error loading camera${i} data:`, error);
      }
    }
    
    // If we couldn't load any camera data, use fallback data
    if (cameras.length === 0) {
      cameras.push({
        id: 1,
        location: "Central Park West Entrance",
        timestamp: new Date().toISOString(),
        imageUrl: "/images/cameras/camera1.jpg",
        detections: [
          {
            confidence: 0.92,
            description: "Male, 30s, red shirt",
            bounding_box: { x: 100, y: 100, width: 200, height: 400 },
            details: {
              clothing: "Red t-shirt, blue jeans",
              distinctive_features: "Baseball cap",
              environment: "Park entrance"
            }
          }
        ]
      });
    }
    
    res.json(cameras);
  });

  // Individual camera endpoint
  app.get("/api/camera-footage/:id", (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const jsonPath = path.join(process.cwd(), 'public', 'images', 'cameras', `camera${id}.json`);
      if (fs.existsSync(jsonPath)) {
        const cameraData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        return res.json(cameraData);
      }
    } catch (error) {
      console.error(`Error loading camera${id} data:`, error);
    }
    
    // Fallback if file doesn't exist or can't be read
    res.json({
      id,
      location: `Camera Location ${id}`,
      timestamp: new Date().toISOString(),
      imageUrl: `/images/cameras/camera${id}.jpg`,
      detections: [
        {
          confidence: 0.92,
          description: "Male, 30s, red shirt",
          bounding_box: { x: 100, y: 100, width: 200, height: 400 },
          details: {
            clothing: "Red t-shirt, blue jeans",
            distinctive_features: "Baseball cap",
            environment: "Near park entrance"
          }
        }
      ]
    });
  });

  // Mock search endpoint
  app.post("/api/search", (req, res) => {
    const { query } = req.body;
    res.json({
      matches: [
        {
          caseId: 1,
          detection: {
            confidence: 0.92,
            description: "Male, 30s, red shirt",
            bounding_box: { x: 100, y: 100, width: 200, height: 400 },
            details: {
              clothing: "Red t-shirt, blue jeans",
              distinctive_features: "Baseball cap",
              environment: "Park entrance"
            }
          },
          footage: {
            id: 1,
            location: "Central Park West",
            timestamp: new Date().toISOString(),
            imageUrl: "/images/cameras/camera1.jpg"
          },
          similarityScore: 0.85
        }
      ],
      analysis: [
        "Results show a potential match at Central Park West.",
        "Subject appears to be wearing clothing matching the description."
      ]
    });
  });

  // Mock upload endpoint
  app.post("/api/upload", upload.single("image"), (req, res) => {
    res.json({
      success: true,
      imageUrl: "/images/cameras/camera1.jpg"
    });
  });

  return server;
} 