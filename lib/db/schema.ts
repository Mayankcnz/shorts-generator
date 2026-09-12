import { sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { STORY_TYPES } from "@/lib/contracts/clip";

export const analysisJobStatus = pgEnum("analysis_job_status", [
  "queued",
  "processing",
  "completed",
  "failed",
]);

export const clipStoryType = pgEnum("clip_story_type", STORY_TYPES);

export const analysisJobs = pgTable(
  "analysis_jobs",
  {
    id: uuid().defaultRandom().primaryKey(),
    videoUrl: text("video_url").notNull(),
    videoId: text("video_id"),
    status: analysisJobStatus().default("queued").notNull(),
    transcript: text(),
    error: text(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("analysis_jobs_status_created_at_idx").on(
      table.status,
      table.createdAt,
    ),
    index("analysis_jobs_video_id_idx").on(table.videoId),
    check(
      "analysis_jobs_attempt_count_nonnegative",
      sql`${table.attemptCount} >= 0`,
    ),
  ],
);

export const clipSuggestions = pgTable(
  "clip_suggestions",
  {
    id: uuid().defaultRandom().primaryKey(),
    analysisJobId: uuid("analysis_job_id")
      .notNull()
      .references(() => analysisJobs.id, { onDelete: "cascade" }),
    title: text().notNull(),
    startSeconds: doublePrecision("start_seconds").notNull(),
    endSeconds: doublePrecision("end_seconds").notNull(),
    score: doublePrecision().notNull(),
    hook: text().notNull(),
    whyItWorks: text("why_it_works").notNull(),
    storyType: clipStoryType("story_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("clip_suggestions_analysis_job_id_idx").on(table.analysisJobId),
    check(
      "clip_suggestions_start_nonnegative",
      sql`${table.startSeconds} >= 0`,
    ),
    check(
      "clip_suggestions_end_after_start",
      sql`${table.endSeconds} > ${table.startSeconds}`,
    ),
    check(
      "clip_suggestions_score_range",
      sql`${table.score} >= 0 AND ${table.score} <= 10`,
    ),
  ],
);

export type AnalysisJob = typeof analysisJobs.$inferSelect;
export type NewAnalysisJob = typeof analysisJobs.$inferInsert;
export type StoredClipSuggestion = typeof clipSuggestions.$inferSelect;
export type NewStoredClipSuggestion = typeof clipSuggestions.$inferInsert;
