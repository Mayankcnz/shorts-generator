import { loadEnvConfig } from "@next/env";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { createAnalysisJobRepository } from "@/lib/db/analysisJobRepository";
import { analysisJobs } from "@/lib/db/schema";

loadEnvConfig(process.cwd());

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL is required for repository integration tests.",
  );
}

const pool = new Pool({ connectionString: testDatabaseUrl });
const database = drizzle({ client: pool });
const baseRepository = createAnalysisJobRepository(database);
const createdJobIds: string[] = [];
const repository = {
  ...baseRepository,
  async create(videoUrl: string) {
    const job = await baseRepository.create(videoUrl);
    createdJobIds.push(job.id);
    return job;
  },
};

describe("analysisJobRepository", () => {
  beforeAll(async () => {
    await pool.query("select 1");
  });

  afterEach(async () => {
    if (createdJobIds.length > 0) {
      await database.delete(analysisJobs)
        .where(inArray(analysisJobs.id, createdJobIds));
      createdJobIds.length = 0;
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates and retrieves a queued analysis job", async () => {
    const created = await repository.create(
      "https://www.youtube.com/watch?v=abc123",
    );

    const result = await repository.findById(created.id);

    expect(created.status).toBe("queued");
    expect(result?.job.id).toBe(created.id);
    expect(result?.job.videoUrl).toBe(
      "https://www.youtube.com/watch?v=abc123",
    );
    expect(result?.clips).toEqual([]);
  });

  it("claims the oldest queued job exactly once", async () => {
    const created = await repository.create(
      "https://www.youtube.com/watch?v=abc123",
    );

    const firstClaim = await repository.claimNextQueued();
    const secondClaim = await repository.claimNextQueued();

    expect(firstClaim?.id).toBe(created.id);
    expect(firstClaim?.status).toBe("processing");
    expect(firstClaim?.attemptCount).toBe(1);
    expect(secondClaim).toBeNull();
  });

  it("stores a completed transcript and its clip suggestions", async () => {
    const created = await repository.create(
      "https://www.youtube.com/watch?v=abc123",
    );

    await repository.complete(created.id, {
      transcript: "Example transcript",
      clips: [
        {
          title: "Example clip",
          start: 10,
          end: 40,
          score: 9,
          hook: "Example hook",
          whyItWorks: "It has a clear setup and payoff.",
          storyType: "story",
        },
      ],
    });

    const result = await repository.findById(created.id);

    expect(result?.job.status).toBe("completed");
    expect(result?.job.transcript).toBe("Example transcript");
    expect(result?.clips).toHaveLength(1);
    expect(result?.clips[0]).toMatchObject({
      title: "Example clip",
      startSeconds: 10,
      endSeconds: 40,
    });
  });

  it("records a processing failure", async () => {
    const created = await repository.create(
      "https://www.youtube.com/watch?v=abc123",
    );

    await repository.fail(created.id, "FFmpeg failed");

    const [stored] = await database
      .select()
      .from(analysisJobs)
      .where(eq(analysisJobs.id, created.id));

    expect(stored).toMatchObject({
      status: "failed",
      error: "FFmpeg failed",
    });
  });
  it("allows concurrent workers to claim a queued job only once", async () => {
    const created = await repository.create("https://youtu.be/abc123");
    const claims = await Promise.all([
      repository.claimNextQueued(),
      repository.claimNextQueued(),
    ]);
    expect(claims.filter((job) => job?.id === created.id)).toHaveLength(1);
    expect(claims.filter((job) => job === null)).toHaveLength(1);
  });

  it.each(["queued", "processing"] as const)(
    "rejects another active job for a video with a %s job",
    async (status) => {
      const videoId = crypto.randomUUID();
      const [existing] = await database.insert(analysisJobs).values({
        videoUrl: `https://youtu.be/${videoId}`,
        videoId,
        status,
      }).returning();
      createdJobIds.push(existing.id);

      // Use PostgreSQL directly so we can assert its actual error code.
      // The transaction guarantees cleanup even if the insert unexpectedly succeeds.
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await expect(client.query(
          "INSERT INTO analysis_jobs (video_url, video_id) VALUES ($1, $2)",
          [`https://youtu.be/${videoId}`, videoId],
        )).rejects.toMatchObject({
          code: "23505",
          constraint: "analysis_jobs_active_video_id_unique",
        });
      } finally {
        await client.query("ROLLBACK");
        client.release();
      }

      const stored = await database.select().from(analysisJobs)
        .where(eq(analysisJobs.videoId, videoId));
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe(existing.id);
    },
  );

  it.each(["completed", "failed"] as const)(
    "allows a new queued job after a %s job",
    async (status) => {
      const videoId = crypto.randomUUID();
      for (const jobStatus of [status, "queued"] as const) {
        const [job] = await database.insert(analysisJobs).values({
          videoUrl: `https://youtu.be/${videoId}`,
          videoId,
          status: jobStatus,
        }).returning();
        createdJobIds.push(job.id);
      }
      const stored = await database.select().from(analysisJobs)
        .where(eq(analysisJobs.videoId, videoId));
      expect(stored).toHaveLength(2);
      expect(stored.filter((job) => job.status === "queued")).toHaveLength(1);
    },
  );

});
