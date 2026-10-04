import { analyzeVideo, type AnalyzeDependencies } from "@/lib/analyzeVideo";
import type { AnalysisJobRepository } from "@/lib/db/analysisJobRepository";

type ProcessingRepository = Pick<
  AnalysisJobRepository,
  "claimNextQueued" | "complete" | "fail"
>;

export type ProcessNextJobResult =
  | { processed: false }
  | {
      processed: true;
      jobId: string;
      status: "completed" | "failed";
    };

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown video-processing failure";
}

export async function processNextAnalysisJob(
  repository: ProcessingRepository,
  dependencies: AnalyzeDependencies,
): Promise<ProcessNextJobResult> {
  const job = await repository.claimNextQueued();

  if (!job) {
    return { processed: false };
  }

  try {
    const result = await analyzeVideo(job.videoUrl, dependencies);

    await repository.complete(job.id, result);

    return {
      processed: true,
      jobId: job.id,
      status: "completed",
    };
  } catch (error) {
    await repository.fail(job.id, getErrorMessage(error));

    return {
      processed: true,
      jobId: job.id,
      status: "failed",
    };
  }
}
