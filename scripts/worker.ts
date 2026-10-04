import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const IDLE_POLL_INTERVAL_MS = 2_000;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * the script starts a separate Node.js process that remains alive,
 *  checks PostgreSQL for queued jobs, processes them one at a time and
 * stops gracefully when it receives a termination signal.
 */

async function main() {
  loadEnvConfig(process.cwd());

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run the local worker.");
  }

  const [
    { createAnalysisJobRepository },
    { processNextAnalysisJob },
    { realAnalyzeDependencies },
  ] = await Promise.all([
    import("../lib/db/analysisJobRepository"),
    import("../lib/jobs/processNextAnalysisJob"),
    import("../lib/realAnalyzeDependencies"),
  ]);

  const pool = new Pool({ connectionString: databaseUrl });
  const database = drizzle({ client: pool });
  const repository = createAnalysisJobRepository(database);

  let stopping = false;

  function stop() {
    stopping = true;
  }

  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  console.log("Local analysis worker started.");

  try {
    while (!stopping) {
      const result = await processNextAnalysisJob(
        repository,
        realAnalyzeDependencies,
      );

      if (result.processed) {
        console.log(`Job ${result.jobId}: ${result.status}`);
        continue;
      }

      await wait(IDLE_POLL_INTERVAL_MS);
    }
  } finally {
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
    await pool.end();
  }
  console.log("Local analysis worker stopped.");
}

main().catch((error: unknown) => {
  console.error("Local analysis worker failed", error);
  process.exitCode = 1;
});
