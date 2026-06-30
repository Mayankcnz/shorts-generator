"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyzeVideo() {
    setLoading(true);
    setTranscript("");

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    setTranscript(data.transcript || data.error);
    setLoading(false);
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
          className="bg-white text-black px-6 py-3 rounded font-semibold"
        >
          {loading ? "Analyzing..." : "Analyze Video"}
        </button>

        {transcript && (
          <div className="bg-zinc-900 p-5 rounded whitespace-pre-wrap">
            {transcript}
          </div>
        )}
      </div>
    </main>
  );
}