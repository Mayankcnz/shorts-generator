import type { ClipSuggestion } from "@/lib/contracts/clip";
import type { AnalysisJob } from "@/lib/db/schema";

export type AnalysisJobResponse = {
  id: string;
  videoUrl: string;
  status: AnalysisJob["status"];
  transcript: string | null;
  error: string | null;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  clips: ClipSuggestion[];
};
