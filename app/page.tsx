"use client";

import { useState } from "react";

type Clip = {
  title: string;
  start: string;
  end: string;
  score: number;
  reason: string;
  hook: string;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);

  async function analyzeVideo() {
    setLoading(true);
    setTranscript("");
    setClips([]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTranscript(data.error || "Something went wrong.");
        return;
      }

      setTranscript(data.transcript || "");
      setClips(data.clips || []);
    } catch {
      setTranscript("Failed to analyze video.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-10 bg-black text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">Shorts Generator</h1>

        <input
          className="w-full p-4 rounded text-black"
          placeholder="Paste YouTube URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={analyzeVideo}
          disabled={loading || !url}
          className="bg-white text-black px-6 py-3 rounded font-semibold disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Video"}
        </button>

        {clips.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Suggested Shorts</h2>

            {clips.map((clip, index) => (
              <div key={index} className="bg-zinc-900 p-5 rounded space-y-2">
                <div className="text-xl font-semibold">{clip.title}</div>
                <div>
                  {clip.start} → {clip.end}
                </div>
                <div>Score: {clip.score}/10</div>
                <div>Hook: {clip.hook}</div>
                <div className="text-zinc-400">{clip.reason}</div>
              </div>
            ))}
          </div>
        )}

        {transcript && (
          <div className="bg-zinc-900 p-5 rounded whitespace-pre-wrap">
            <h2 className="text-2xl font-bold mb-4">Transcript</h2>
            {transcript}
          </div>
        )}
      </div>
    </main>
  );
}