import { pgTable, text, serial, timestamp, json, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  lastLocation: text("last_location").notNull(),
  status: text("status").notNull().default("active"),
  timeline: json("timeline").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  images: text("images").array().notNull().default([]),
  aiAnalysis: jsonb("ai_analysis").notNull().default({
    entities: [],
    locations: [],
    timestamps: [],
    confidence: 0
  }),
  lastSighting: timestamp("last_sighting"),
  transportMode: text("transport_mode").default("walking"),
  searchRadius: json("search_radius").default({
    radius: 0,
    probableLocations: []
  })
});

export const cameraFootage = pgTable("camera_footage", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  location: text("location").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  footage: text("footage").notNull(), // URL to footage
  aiAnalysis: jsonb("ai_analysis").notNull().default({
    detections: [],
    summary: "",
    processedAt: null
  })
});

export const personDetections = pgTable("person_detections", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  confidence: json("confidence").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  thumbnail: text("thumbnail").notNull(),
  bbox: json("bbox").notNull(),
  details: jsonb("details").notNull(),
  cameraId: integer("camera_id"),
  matchScore: json("match_score")
});

export const cameras = pgTable("cameras", {
  id: serial("id").primaryKey(),
  location: text("location").notNull(),
  lastActive: timestamp("last_active").defaultNow()
});

export const insertCaseSchema = createInsertSchema(cases).omit({ 
  id: true,
  createdAt: true,
  timeline: true,
  aiAnalysis: true,
  searchRadius: true
});

export const insertCameraFootageSchema = createInsertSchema(cameraFootage).omit({
  id: true,
  aiAnalysis: true
});

export const insertPersonDetectionSchema = createInsertSchema(personDetections).omit({ 
  id: true,
  matchScore: true
});

export const insertCameraSchema = createInsertSchema(cameras).omit({
  id: true,
  lastActive: true
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type CameraFootage = typeof cameraFootage.$inferSelect;
export type InsertCameraFootage = z.infer<typeof insertCameraFootageSchema>;
export type PersonDetection = typeof personDetections.$inferSelect;
export type InsertPersonDetection = z.infer<typeof insertPersonDetectionSchema>;
export type Camera = typeof cameras.$inferSelect;
export type InsertCamera = z.infer<typeof insertCameraSchema>;

// Additional type definitions for AI analysis results
export interface TimelineEvent {
  time: string;
  event: string;
  details?: Record<string, any>;
}

export interface SearchRadius {
  radius: number;
  probableLocations: {
    lat: number;
    lng: number;
    probability: number;
  }[];
}

export interface AIAnalysis {
  entities: string[];
  locations: string[];
  timestamps: string[];
  confidence: number;
}

export interface CameraAIAnalysis {
  detections: {
    confidence: number;
    bbox: [number, number, number, number];
    description: string;
  }[];
  summary: string;
  processedAt: string | null;
}