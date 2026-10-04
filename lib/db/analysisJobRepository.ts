import { asc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type { AnalyzeResult } from "@/lib/analyzeVideo";
import {
  analysisJobs,
  clipSuggestions,
  type AnalysisJob,
  type StoredClipSuggestion,
} from "@/lib/db/schema";

export type AnalysisJobWithClips = {
  job: AnalysisJob;
  clips: StoredClipSuggestion[];
};

export type AnalysisJobRepository = ReturnType<
  typeof createAnalysisJobRepository
>;

export function createAnalysisJobRepository(
  database: NodePgDatabase,
) {
  return {
    async create(videoUrl: string): Promise<AnalysisJob> {
      const [job] = await database
        .insert(analysisJobs)
        .values({ videoUrl })
        .returning();

      if (!job) {
        throw new Error("PostgreSQL did not return the created analysis job.");
      }

      return job;
    },

    async findById(id: string): Promise<AnalysisJobWithClips | null> {
      const [job] = await database
        .select()
        .from(analysisJobs)
        .where(eq(analysisJobs.id, id))
        .limit(1);

      if (!job) {
        return null;
      }

      const clips = await database
        .select()
        .from(clipSuggestions)
        .where(eq(clipSuggestions.analysisJobId, id))
        .orderBy(asc(clipSuggestions.startSeconds));

      return { job, clips };
    },

    async claimNextQueued(): Promise<AnalysisJob | null> {
      return database.transaction(async (transaction) => {
        const [queuedJob] = await transaction
          .select()
          .from(analysisJobs)
          .where(eq(analysisJobs.status, "queued"))
          .orderBy(asc(analysisJobs.createdAt))
          .limit(1)
          .for("update", { skipLocked: true });

        if (!queuedJob) {
          return null;
        }

        const [claimedJob] = await transaction
          .update(analysisJobs)
          .set({
            status: "processing",
            startedAt: new Date(),
            updatedAt: new Date(),
            attemptCount: queuedJob.attemptCount + 1,
            error: null,
          })
          .where(eq(analysisJobs.id, queuedJob.id))
          .returning();

        return claimedJob ?? null;
      });
    },

    async complete(id: string, result: AnalyzeResult): Promise<AnalysisJob> {
      return database.transaction(async (transaction) => {
        await transaction
          .delete(clipSuggestions)
          .where(eq(clipSuggestions.analysisJobId, id));

        if (result.clips.length > 0) {
          await transaction.insert(clipSuggestions).values(
            result.clips.map((clip) => ({
              analysisJobId: id,
              title: clip.title,
              startSeconds: clip.start,
              endSeconds: clip.end,
              score: clip.score,
              hook: clip.hook,
              whyItWorks: clip.whyItWorks,
              storyType: clip.storyType,
            })),
          );
        }

        const [job] = await transaction
          .update(analysisJobs)
          .set({
            status: "completed",
            transcript: result.transcript,
            error: null,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(analysisJobs.id, id))
          .returning();

        if (!job) {
          throw new Error(`Analysis job ${id} does not exist.`);
        }

        return job;
      });
    },

    async fail(id: string, error: string): Promise<AnalysisJob> {
      const [job] = await database
        .update(analysisJobs)
        .set({
          status: "failed",
          error,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(analysisJobs.id, id))
        .returning();

      if (!job) {
        throw new Error(`Analysis job ${id} does not exist.`);
      }

      return job;
    },
  };
}
