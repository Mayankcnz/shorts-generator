import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateClipSuggestions } from "@/lib/generateClipSuggestions";

const validSuggestion = {
  title: "A complete story",
  start: 10,
  end: 40,
  score: 7.5,
  hook: "This changed everything.",
  whyItWorks: "It has a clear setup, tension, and payoff.",
  storyType: "story",
};

function ollamaResponse(response: string, status = 200): Response {
  return new Response(JSON.stringify({ response }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("generateClipSuggestions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  it("returns no suggestions without calling Ollama for an empty transcript", async () => {
    await expect(generateClipSuggestions("   ")).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("parses, validates, sorts, and clamps suggestions", async () => {
    const modelSuggestions = [
      validSuggestion,
      {
        ...validSuggestion,
        title: "The strongest moment",
        start: 50,
        end: 85,
        score: 12,
      },
      {
        ...validSuggestion,
        title: "Too short",
        start: 90,
        end: 100,
        score: 9,
      },
      {
        ...validSuggestion,
        title: "Outside the video",
        start: 110,
        end: 140,
        score: 8,
      },
    ];

    vi.mocked(fetch).mockResolvedValue(
      ollamaResponse(`\`\`\`json\n${JSON.stringify(modelSuggestions)}\n\`\`\``),
    );

    const suggestions = await generateClipSuggestions(
      "[0 - 60] Opening\n[60 - 120] Ending",
    );

    expect(suggestions).toHaveLength(2);
    expect(suggestions.map(({ title, score }) => ({ title, score }))).toEqual([
      { title: "The strongest moment", score: 10 },
      { title: "A complete story", score: 7.5 },
    ]);
  });

  it("rejects when Ollama returns an unsuccessful response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("service unavailable", { status: 503 }),
    );

    await expect(
      generateClipSuggestions("[0 - 60] A valid transcript"),
    ).rejects.toThrow(
      "Ollama request failed with status 503: service unavailable",
    );
  });

  it("rejects when every model suggestion is invalid", async () => {
    vi.mocked(fetch).mockResolvedValue(
      ollamaResponse(
        JSON.stringify([
          {
            ...validSuggestion,
            start: 10,
            end: 15,
          },
        ]),
      ),
    );

    await expect(
      generateClipSuggestions("[0 - 60] A valid transcript"),
    ).rejects.toThrow("The model returned no valid clip suggestions.");
  });
});
