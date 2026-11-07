import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AnalysisJob } from "@/lib/db/schema";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  findById: vi.fn(),
}));

vi.mock("@/lib/db/repositories", () => ({
  analysisJobRepository: mocks,
}));

import { GET } from "@/app/api/jobs/[jobId]/route";
import { POST } from "@/app/api/jobs/route";

const createdAt = new Date("2026-09-30T00:00:00.000Z");

const queuedJob: AnalysisJob = {
  id: "017f22e2-79b0-4b72-ab85-6758c8f3666a",
  videoUrl: "https://www.youtube.com/watch?v=abc123",
  videoId: null,
  status: "queued",
  transcript: null,
  error: null,
  attemptCount: 0,
  createdAt,
  updatedAt: createdAt,
  startedAt: null,
  completedAt: null,
};

describe("analysis job routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a queued job and returns 202 Accepted", async () => {
    mocks.create.mockResolvedValue(queuedJob);

    const request = new Request("http://localhost/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://www.youtube.com/watch?v=abc123",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(202);
    expect(mocks.create).toHaveBeenCalledExactlyOnceWith(queuedJob.videoUrl);
    expect(response.headers.get("Location")).toBe(
      `/api/jobs/${queuedJob.id}`,
    );
    await expect(response.json()).resolves.toEqual({
      jobId: queuedJob.id,
      status: "queued",
    });
  });

  it("rejects an invalid video URL", async () => {
    const request = new Request("http://localhost/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "not-a-url" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("retrieves a job and serializes its clips", async () => {
    mocks.findById.mockResolvedValue({
      job: {
        ...queuedJob,
        status: "completed",
        transcript: "Example transcript",
        completedAt: createdAt,
      },
      clips: [
        {
          id: "8f3da16e-959c-4f84-b8b0-58d5144b04ca",
          analysisJobId: queuedJob.id,
          title: "Example clip",
          startSeconds: 0,
          endSeconds: 30,
          score: 9,
          hook: "Example hook",
          whyItWorks: "It has a clear setup and payoff.",
          storyType: "story",
          createdAt,
        },
      ],
    });

    const response = await GET(
      new Request(`http://localhost/api/jobs/${queuedJob.id}`),
      {
        params: Promise.resolve({ jobId: queuedJob.id }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: queuedJob.id,
      status: "completed",
      transcript: "Example transcript",
      clips: [
        {
          title: "Example clip",
          start: 0,
          end: 30,
        },
      ],
    });
  });

  it("returns 404 for an unknown job", async () => {
    mocks.findById.mockResolvedValue(null);

    const response = await GET(
      new Request(`http://localhost/api/jobs/${queuedJob.id}`),
      {
        params: Promise.resolve({ jobId: queuedJob.id }),
      },
    );

    expect(response.status).toBe(404);
  });
  it("rejects malformed JSON without creating a job", async () => {
    const response = await POST(new Request("http://localhost/api/jobs", {
      method: "POST",
      body: "{",
    }));
    expect(response.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects malformed job IDs before querying PostgreSQL", async () => {
    const response = await GET(new Request("http://localhost/api/jobs/invalid"), {
      params: Promise.resolve({ jobId: "invalid" }),
    });
    expect(response.status).toBe(400);
    expect(mocks.findById).not.toHaveBeenCalled();
  });

  it("returns a JSON error when the database is unavailable", async () => {
    mocks.findById.mockRejectedValue(new Error("Database unavailable"));
    const response = await GET(new Request(`http://localhost/api/jobs/${queuedJob.id}`), {
      params: Promise.resolve({ jobId: queuedJob.id }),
    });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Unable to retrieve the analysis job.",
    });
  });

  it.each([{}, null, [], { url: 123 }, { url: "https://example.com/video" }])(
    "rejects an invalid submission body: %j",
    async (body) => {
      const response = await POST(new Request("http://localhost/api/jobs", {
        method: "POST",
        body: JSON.stringify(body),
      }));
      expect(response.status).toBe(400);
      expect(mocks.create).not.toHaveBeenCalled();
    },
  );

  it("returns a safe error when creating a job fails", async () => {
    mocks.create.mockRejectedValueOnce(new Error("Private database details"));
    const response = await POST(new Request("http://localhost/api/jobs", {
      method: "POST",
      body: JSON.stringify({ url: queuedJob.videoUrl }),
    }));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Unable to create the analysis job.",
    });
  });

});
