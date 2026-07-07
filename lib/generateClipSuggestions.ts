export type ClipSuggestion = {
  title: string;
  start: string;
  end: string;
  score: number;
  reason: string;
  hook: string;
};

export async function generateClipSuggestions(
  transcript: string
): Promise<ClipSuggestion[]> {
  const prompt = `
You are an expert short-form video editor.

From this transcript, find 5 continuous short-form clips.

Rules:
- Each clip must be one continuous section.
- Duration should be 20 to 60 seconds.
- The clip must make sense without outside context.
- Return only valid JSON.

JSON format:
[
  {
    "title": "...",
    "start": "00:00:00",
    "end": "00:00:00",
    "score": 8.5,
    "reason": "...",
    "hook": "..."
  }
]

Transcript:
${transcript}
`;

  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen2.5:7b",
      prompt,
      stream: false,
    }),
  });

  const data = await res.json();

  console.log("Ollama response:", data);

  if (!res.ok) {
    throw new Error(data.error || "Ollama request failed");
  }

  if (!data.response) {
    throw new Error(`Ollama returned no response: ${JSON.stringify(data)}`);
  }

  const text = data.response.trim();

  const jsonStart = text.indexOf("[");
  const jsonEnd = text.lastIndexOf("]") + 1;

  if (jsonStart === -1 || jsonEnd <= 0) {
    throw new Error(`Could not parse JSON from Ollama response: ${text}`);
  }

  return JSON.parse(text.slice(jsonStart, jsonEnd));
}