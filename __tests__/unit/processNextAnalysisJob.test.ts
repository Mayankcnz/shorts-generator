import { describe, expect, it, vi } from "vitest";

import type { AnalyzeDependencies } from "@/lib/analyzeVideo";
import type { AnalysisJobRepository } from "@/lib/db/analysisJobRepository";
import type { AnalysisJob } from "@/lib/db/schema";
import { processNextAnalysisJob } from "@/lib/jobs/processNextAnalysisJob";

const processingJob: AnalysisJob = {
  id: "017f22e2-79b0-4b72-ab85-6758c8f3666a",
  videoUrl: "https://www.youtube.com/watch?v=abc123",
  videoId: null,
  status: "processing",
  transcript: null,
  error: null,
  attemptCount: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  startedAt: new Date(),
  completedAt: null,
};

function createDependencies(): AnalyzeDependencies {
  return {
    runCommand: vi.fn().mockResolvedValue(undefined),
    fileExists: vi.fn().mockResolvedValue(true),
    createDirectory: vi.fn().mockResolvedValue(undefined),
    readTextFile: vi.fn().mockResolvedValue("Example transcript"),
    generateClips: vi.fn().mockResolvedValue([]),
  };
}

function createRepository() {
  return {
    claimNextQueued:
      vi.fn<AnalysisJobRepository["claimNextQueued"]>(),
    complete: vi.fn<AnalysisJobRepository["complete"]>(),
    fail: vi.fn<AnalysisJobRepository["fail"]>(),
  };
}

describe("processNextAnalysisJob", () => {
  it("does nothing when no queued job exists", async () => {
    const repository = createRepository();
    repository.claimNextQueued.mockResolvedValue(null);

    const result = await processNextAnalysisJob(
      repository,
      createDependencies(),
    );

    expect(result).toEqual({ processed: false });
    expect(repository.complete).not.toHaveBeenCalled();
  });

  it("processes and completes a claimed job", async () => {
    const repository = createRepository();
    repository.claimNextQueued.mockResolvedValue(processingJob);
    repository.complete.mockResolvedValue({
      ...processingJob,
      status: "completed",
    });

    const result = await processNextAnalysisJob(
      repository,
      createDependencies(),
    );

    expect(result).toEqual({
      processed: true,
      jobId: processingJob.id,
      status: "completed",
    });
    expect(repository.complete).toHaveBeenCalledWith(
      processingJob.id,
      {
        transcript: "Example transcript",
        clips: [],
      },
    );
  });

  it("records a failure when processing throws", async () => {
    const repository = createRepository();
    repository.claimNextQueued.mockResolvedValue(processingJob);
    repository.fail.mockResolvedValue({
      ...processingJob,
      status: "failed",
      error: "FFmpeg failed",
    });

    const dependencies = createDependencies();
    vi.mocked(dependencies.readTextFile).mockRejectedValue(
      new Error("FFmpeg failed"),
    );

    const result = await processNextAnalysisJob(
      repository,
      dependencies,
    );

    expect(repository.fail).toHaveBeenCalledWith(
      processingJob.id,
      "FFmpeg failed",
    );
    expect(result).toEqual({
      processed: true,
      jobId: processingJob.id,
      status: "failed",
    });
  });
  it("records no-speech input as failed without calling the model", async () => {
    const repository = createRepository();
    repository.claimNextQueued.mockResolvedValue(processingJob);
    const dependencies = createDependencies();
    vi.mocked(dependencies.readTextFile).mockResolvedValue(
      "[90.00 - 97.00] .\n[97.00 - 104.00] .",
    );

    const result = await processNextAnalysisJob(repository, dependencies);

    expect(result).toEqual({
      processed: true,
      jobId: processingJob.id,
      status: "failed",
    });
    expect(repository.fail).toHaveBeenCalledExactlyOnceWith(
      processingJob.id, "No usable speech detected.",
    );
    expect(repository.complete).not.toHaveBeenCalled();
    expect(dependencies.generateClips).not.toHaveBeenCalled();
  });

});
