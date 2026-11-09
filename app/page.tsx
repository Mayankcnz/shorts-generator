"use client";

import { useEffect, useState } from "react";
import type { AnalysisJobResponse } from "@/lib/contracts/analysisJob";
import { formatTimestamp } from "@/lib/formatTimestamp";

const POLL_INTERVAL_MS = 2_000;

type CreateJobResponse = {
  jobId: string;
  status: "queued";
};

function isCreateJobResponse(value: unknown): value is CreateJobResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "jobId" in value &&
    typeof value.jobId === "string" &&
    "status" in value &&
    value.status === "queued"
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<AnalysisJobResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    async function refreshJob() {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        const data: unknown = await response.json();

        if (!response.ok) {
          throw new Error("Unable to retrieve the analysis job.");
        }

        if (cancelled) {
          return;
        }

        const nextJob = data as AnalysisJobResponse;
        setJob(nextJob);
        setError(null);

        if (nextJob.status === "queued" || nextJob.status === "processing") {
          timeout = setTimeout(refreshJob, POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to refresh the job. Retrying…");
          timeout = setTimeout(refreshJob, POLL_INTERVAL_MS);
        }
      }
    }

    void refreshJob();

    return () => {
      cancelled = true;

      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [jobId]);

  async function submitVideo() {
    setSubmitting(true);
    setJobId(null);
    setJob(null);
    setError(null);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data: unknown = await response.json();

      if (!response.ok || !isCreateJobResponse(data)) {
        throw new Error("Unable to create the analysis job.");
      }

      setJobId(data.jobId);
    } catch {
      setError("Failed to create the analysis job.");
    } finally {
      setSubmitting(false);
    }
  }

  const processing = Boolean(jobId) &&
    (!job || job.status === "queued" || job.status === "processing");
  const clips = job?.clips ?? [];

  return (
    <main className="min-h-screen p-10 bg-black text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">Shorts Generator</h1>

        <input
          className="w-full p-4 rounded bg-white text-black"
          aria-label="YouTube video URL"
          placeholder="Paste YouTube URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={submitVideo}
          disabled={submitting || processing || !url}
          className="bg-white text-black px-6 py-3 rounded font-semibold disabled:opacity-50"
        >
          {submitting
            ? "Submitting…"
            : processing
              ? "Analyzing…"
              : "Analyze Video"}
        </button>

        {job && (
          <div className="bg-zinc-900 p-5 rounded space-y-2">
            <div className="font-semibold">Job status: {job.status}</div>
            <div className="text-sm text-zinc-400">Job ID: {job.id}</div>
            {job.error && <div className="text-red-400">{job.error}</div>}
          </div>
        )}

        {error && <div className="text-red-400">{error}</div>}

        {job?.status === "completed" && clips.length === 0 && (
          <p>No suitable clips were identified in this transcript.</p>
        )}

        {clips.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Suggested Shorts</h2>

            {clips.map((clip, index) => (
              <div key={index} className="bg-zinc-900 p-5 rounded space-y-2">
                <div className="text-xl font-semibold">{clip.title}</div>
                <div>
                  {formatTimestamp(clip.start)} → {formatTimestamp(clip.end)}
                </div>
                <div>Score: {clip.score}/10</div>
                <div>Hook: {clip.hook}</div>
                <div className="capitalize">Type: {clip.storyType}</div>
                <div className="text-zinc-400">{clip.whyItWorks}</div>
              </div>
            ))}
          </div>
        )}

        {job?.transcript && (
          <div className="bg-zinc-900 p-5 rounded whitespace-pre-wrap">
            <h2 className="text-2xl font-bold mb-4">Transcript</h2>
            {job.transcript}
          </div>
        )}
      </div>
    </main>
  );
}
