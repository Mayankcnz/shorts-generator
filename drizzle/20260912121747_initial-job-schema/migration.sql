CREATE TYPE "analysis_job_status" AS ENUM('queued', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "clip_story_type" AS ENUM('story', 'reflection', 'lesson', 'comedy', 'conflict', 'transformation', 'opinion', 'educational');--> statement-breakpoint
CREATE TABLE "analysis_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"video_url" text NOT NULL,
	"video_id" text,
	"status" "analysis_job_status" DEFAULT 'queued'::"analysis_job_status" NOT NULL,
	"transcript" text,
	"error" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	CONSTRAINT "analysis_jobs_attempt_count_nonnegative" CHECK ("attempt_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "clip_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"analysis_job_id" uuid NOT NULL,
	"title" text NOT NULL,
	"start_seconds" double precision NOT NULL,
	"end_seconds" double precision NOT NULL,
	"score" double precision NOT NULL,
	"hook" text NOT NULL,
	"why_it_works" text NOT NULL,
	"story_type" "clip_story_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clip_suggestions_start_nonnegative" CHECK ("start_seconds" >= 0),
	CONSTRAINT "clip_suggestions_end_after_start" CHECK ("end_seconds" > "start_seconds"),
	CONSTRAINT "clip_suggestions_score_range" CHECK ("score" >= 0 AND "score" <= 10)
);
--> statement-breakpoint
CREATE INDEX "analysis_jobs_status_created_at_idx" ON "analysis_jobs" ("status","created_at");--> statement-breakpoint
CREATE INDEX "analysis_jobs_video_id_idx" ON "analysis_jobs" ("video_id");--> statement-breakpoint
CREATE INDEX "clip_suggestions_analysis_job_id_idx" ON "clip_suggestions" ("analysis_job_id");--> statement-breakpoint
ALTER TABLE "clip_suggestions" ADD CONSTRAINT "clip_suggestions_analysis_job_id_analysis_jobs_id_fkey" FOREIGN KEY ("analysis_job_id") REFERENCES "analysis_jobs"("id") ON DELETE CASCADE;