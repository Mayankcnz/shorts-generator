import type { AnalysisJobResponse } from "@/lib/contracts/analysisJob";
import type { AnalysisJobWithClips } from "@/lib/db/analysisJobRepository";

function toIsoString(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

export function serializeAnalysisJob(
  result: AnalysisJobWithClips,
): AnalysisJobResponse {
  const { job, clips } = result;

  return {
    id: job.id,
    videoUrl: job.videoUrl,
    status: job.status,
    transcript: job.transcript,
    error: job.error,
    attemptCount: job.attemptCount,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    startedAt: toIsoString(job.startedAt),
    completedAt: toIsoString(job.completedAt),
    clips: clips.map((clip) => ({
      title: clip.title,
      start: clip.startSeconds,
      end: clip.endSeconds,
      score: clip.score,
      hook: clip.hook,
      whyItWorks: clip.whyItWorks,
      storyType: clip.storyType,
    })),
  };
}
