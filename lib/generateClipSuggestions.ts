export type ClipSuggestion = {
  title: string;
  start: number;
  end: number;
  score: number;
  hook: string;
  whyItWorks: string;
  storyType: string;
};

type OllamaResponse = {
  response?: string;
};

function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");

  if (firstBracket === -1 || lastBracket === -1) {
    throw new Error("The model did not return a JSON array.");
  }

  return JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
}

function isValidClipSuggestion(value: unknown): value is ClipSuggestion {
  if (!value || typeof value !== "object") {
    return false;
  }

  const clip = value as Record<string, unknown>;

  return (
    typeof clip.title === "string" &&
    typeof clip.start === "number" &&
    typeof clip.end === "number" &&
    typeof clip.score === "number" &&
    typeof clip.hook === "string" &&
    typeof clip.whyItWorks === "string" &&
    typeof clip.storyType === "string"
  );
}

function validateClip(
  clip: ClipSuggestion,
  videoDuration: number
): ClipSuggestion | null {
  const duration = clip.end - clip.start;

  if (clip.start < 0) {
    return null;
  }

  if (clip.end <= clip.start) {
    return null;
  }

  if (clip.end > videoDuration) {
    return null;
  }

  if (duration < 15 || duration > 90) {
    return null;
  }

  return {
    ...clip,
    score: Math.max(0, Math.min(10, clip.score)),
  };
}

export async function generateClipSuggestions(
  transcript: string
): Promise<ClipSuggestion[]> {

  if (!transcript.trim()) {
  return [];
}

const timestamps = [...transcript.matchAll(/\[(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\]/g)];

const videoDuration =
  timestamps.length > 0
    ? Math.max(...timestamps.map((match) => Number(match[2])))
    : Number.POSITIVE_INFINITY;


  const prompt = `
You are a professional short-form video editor.

Your job is to identify the strongest standalone clips from a long-form
YouTube transcript.

The creator makes reflective, story-driven videos. Prioritise moments with:

- a strong opening line
- curiosity or tension
- a clear setup, development, and payoff
- emotional honesty
- humour, surprise, conflict, insight, or transformation
- enough context to make sense on their own
- natural spoken boundaries

Do not simply summarise topics.

Do not choose generic sections only because they mention an interesting subject.

A good clip should feel like a complete miniature story or idea.

Timestamp rules:

- The transcript timestamps are numeric seconds.
- Return start and end as numbers representing seconds.
- Never return timestamps such as "00:09:80".
- Never invent timestamps outside the supplied transcript.
- Clips must be between 15 and 90 seconds.
- Start at the beginning of a complete sentence where possible.
- End after the payoff or conclusion.
- Do not cut off a sentence.
- Do not create overlapping clips unless both are exceptionally strong.

Scoring rules:

- Score each clip from 0 to 10.
- Use different scores.
- 9-10 means exceptional.
- 8-8.9 means strong.
- 7-7.9 means usable but imperfect.
- Do not give every clip the same score.
- Return the clips from highest score to lowest score.

Title rules:

- Write titles a real creator could use.
- Titles should create curiosity without being misleading.
- Avoid generic titles such as "Reflection and Decision".
- Keep titles under 12 words.

Hook rules:

- Quote or closely paraphrase the actual opening idea.
- Do not write vague labels such as "The gym after hours".

whyItWorks rules:

- Explain the editorial reason.
- Mention elements such as setup, tension, payoff, curiosity, conflict,
  emotion, humour, insight, or standalone context.
- Do not write generic praise such as "clear and engaging content".

storyType must be one of:

- story
- reflection
- lesson
- comedy
- conflict
- transformation
- opinion
- educational

Return between 3 and 7 suggestions.

Return only valid JSON in this exact shape:

[
  {
    "title": "I Knew Flying the Drone Was a Bad Idea",
    "start": 62.4,
    "end": 108.7,
    "score": 9.2,
    "hook": "I probably shouldn't have brought a drone into the gym.",
    "whyItWorks": "It opens with immediate tension, develops into a confrontation, and ends with a clear consequence.",
    "storyType": "story"
  }
]

Transcript:

${transcript}
`;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen2.5:7b",
      prompt,
      stream: false,
      format: "json",
      options: {
        temperature: 0.25,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Ollama request failed with status ${response.status}: ${body}`
    );
  }

  const data = (await response.json()) as OllamaResponse;

  if (!data.response) {
    throw new Error("Ollama returned an empty response.");
  }

  console.log("Raw Ollama response:", data.response);

  const parsed = extractJson(data.response);

  if (!Array.isArray(parsed)) {
    throw new Error("Ollama response was not an array.");
  }

  const suggestions = parsed
    .filter(isValidClipSuggestion)
    .map((clip) => validateClip(clip, videoDuration))
    .filter((clip): clip is ClipSuggestion => clip !== null)
    .sort((a, b) => b.score - a.score);

  if (suggestions.length === 0) {
    throw new Error("The model returned no valid clip suggestions.");
  }

  return suggestions;
}