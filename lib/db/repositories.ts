import "server-only";

import { createAnalysisJobRepository } from "@/lib/db/analysisJobRepository";
import { database } from "@/lib/db/client";

export const analysisJobRepository =
  createAnalysisJobRepository(database);
