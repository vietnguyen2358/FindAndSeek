import type { Case } from "@shared/schema";

export async function simulateAiImageAnalysis(image: File): Promise<{
  confidence: number;
  matches: string[];
  locations: string[];
}> {
  await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate processing
  return {
    confidence: 0.92,
    matches: [
      "Person in dark winter coat",
      "Individual with light-colored jacket",
      "Person carrying backpack",
      "Group crossing at intersection"
    ],
    locations: [
      "Downtown crosswalk",
      "Main intersection",
      "City center pedestrian crossing"
    ],
  };
}

export async function simulateAiTextAnalysis(text: string): Promise<{
  entities: string[];
  locations: string[];
  timestamps: string[];
}> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    entities: [
      "Dark winter coat",
      "Light colored jacket",
      "Backpack",
      "Pedestrian crossing",
      "Multiple individuals"
    ],
    locations: [
      "Downtown crosswalk",
      "Main intersection",
      "City center"
    ],
    timestamps: [
      "2024-03-21 15:30",
      "2024-03-21 16:45",
    ],
  };
}

export function generateMockTimeline(caseData: Case): {
  time: string;
  event: string;
}[] {
  return [
    {
      time: new Date(caseData.createdAt).toLocaleString(),
      event: "Case opened",
    },
    {
      time: new Date(Date.now() - 3600000).toLocaleString(),
      event: "Multiple individuals detected at downtown crosswalk",
    },
    {
      time: new Date(Date.now() - 1800000).toLocaleString(),
      event: "High confidence matches in city center area",
    },
  ];
}