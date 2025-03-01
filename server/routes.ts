import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCaseSchema, insertCameraFootageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/cases", async (req, res) => {
    try {
      const caseData = insertCaseSchema.parse(req.body);
      const newCase = await storage.createCase(caseData);
      res.json(newCase);
    } catch (error) {
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
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/footage", async (req, res) => {
    try {
      const footageData = insertCameraFootageSchema.parse(req.body);
      const newFootage = await storage.addCameraFootage(footageData);
      res.json(newFootage);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/cases/:id/footage", async (req, res) => {
    const caseId = parseInt(req.params.id);
    const footage = await storage.getCaseFootage(caseId);
    res.json(footage);
  });

  const httpServer = createServer(app);
  return httpServer;
}
