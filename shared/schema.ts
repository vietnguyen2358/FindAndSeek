import { pgTable, text, serial, timestamp, json, integer } from "drizzle-orm/pg-core";
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
});

export const cameraFootage = pgTable("camera_footage", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  location: text("location").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  footage: text("footage").notNull(), // URL to footage
  aiAnalysis: json("ai_analysis").notNull().default({}),
});

export const insertCaseSchema = createInsertSchema(cases).omit({ 
  id: true,
  createdAt: true,
  timeline: true 
});

export const insertCameraFootageSchema = createInsertSchema(cameraFootage).omit({
  id: true,
  aiAnalysis: true
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type CameraFootage = typeof cameraFootage.$inferSelect;
export type InsertCameraFootage = z.infer<typeof insertCameraFootageSchema>;
