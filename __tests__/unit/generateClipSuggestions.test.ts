import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { generateClipSuggestions } from "@/lib/generateClipSuggestions";

const transcript = "[430.25 - 440.50] Setup.\n[440.50 - 460.75] Payoff.\n[460.75 - 465.00] Ending.\n[465 - 600] Too long.";
const selection = {
  startSegmentId: "S1", endSegmentId: "S2",
  title: "A complete story", score: 7.5, hook: "Setup.",
  whyItWorks: "It has setup and payoff.", storyType: "story",
};
function respond(value: unknown) {
  vi.mocked(fetch).mockImplementation(async () => new Response(JSON.stringify({ response: JSON.stringify(value) })));
}
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});
afterEach(() => vi.unstubAllGlobals());

describe("segment-ID clip generation", () => {
  it("resolves decimal source timestamps and preserves the frontend contract", async () => {
    respond([selection]);
    await expect(generateClipSuggestions(transcript)).resolves.toEqual([{
      title: selection.title, start: 430.25, end: 460.75, score: 7.5,
      hook: selection.hook, whyItWorks: selection.whyItWorks, storyType: "story",
    }]);
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(options!.body as string);
    expect(body.prompt).toContain("S1 [430.25 - 440.50] Setup.");
    expect(body.prompt).toContain("S2 [440.50 - 460.75] Payoff.");
    expect(body.format.items.properties.startSegmentId.enum).toEqual(["S1", "S2", "S3", "S4"]);
    expect(body.format.items.required).not.toContain("start");
    expect(body.format.items.properties).not.toHaveProperty("end");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ startSegmentId: "S999" }, "Unknown transcript segment ID"],
    [{ endSegmentId: "S999" }, "Unknown transcript segment ID"],
    [{ startSegmentId: "S3", endSegmentId: "S1" }, "End segment precedes"],
    [{ startSegmentId: "S1", endSegmentId: "S1" }, "10.3 seconds"],
    [{ startSegmentId: "S4", endSegmentId: "S4" }, "135.0 seconds"],
  ])("rejects invalid ranges after at most two retries: %j", async (changes, error) => {
    respond([{ ...selection, ...changes }]);
    await expect(generateClipSuggestions(transcript)).rejects.toThrow(error);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it.each([15, 90])("accepts a single segment lasting exactly %s seconds", async (duration) => {
    respond([{ ...selection, endSegmentId: "S1" }]);
    const clips = await generateClipSuggestions(`[100 - ${100 + duration}] Complete thought.`);
    expect(clips[0].end - clips[0].start).toBe(duration);
  });

  it("keeps valid selections, sorts, and clamps scores", async () => {
    respond([
      selection,
      { ...selection, title: "Higher", startSegmentId: "S2", endSegmentId: "S3", score: 12 },
      { ...selection, startSegmentId: "S999" },
    ]);
    const clips = await generateClipSuggestions(transcript);
    expect(clips.map(({ title, score }) => ({ title, score }))).toEqual([
      { title: "Higher", score: 10 }, { title: selection.title, score: 7.5 },
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ title: "Legacy", start: 430, end: 460 }],
    { transcript: [{ time: [430, 460], text: "Not a suggestion" }] },
    [{ ...selection, storyType: "unknown" }],
  ])("rejects malformed and legacy output: %j", async (value) => {
    respond(value);
    await expect(generateClipSuggestions(transcript)).rejects.toThrow("No valid clip suggestions.");
  });

  it("rejects out-of-order source timestamps", async () => {
    respond([selection]);
    await expect(generateClipSuggestions("[30 - 40] First.\n[10 - 60] Second."))
      .rejects.toThrow("out-of-order timestamps");
  });

  it("accepts explicit no-match output", async () => {
    respond([]);
    await expect(generateClipSuggestions(transcript)).resolves.toEqual([]);
  });

  it("does not call Ollama for empty input or untimestamped text", async () => {
    await expect(generateClipSuggestions(" ")).resolves.toEqual([]);
    await expect(generateClipSuggestions("Speech without timestamps"))
      .rejects.toThrow("No timestamped transcript segments");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports service and parsing errors", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("unavailable", { status: 503 }));
    await expect(generateClipSuggestions(transcript)).rejects.toThrow("status 503: unavailable");
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.mocked(fetch).mockImplementation(async () => new Response(JSON.stringify({ response: "not JSON" })));
    await expect(generateClipSuggestions(transcript)).rejects.toThrow("Could not find valid JSON");
    expect(fetch).toHaveBeenCalledTimes(4);
  });
  function responseFor(value: unknown) {
    return new Response(JSON.stringify({ response: JSON.stringify(value) }));
  }

  it("corrects an invalid range on the first retry with exact feedback", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(responseFor([{ ...selection, endSegmentId: "S1" }]))
      .mockResolvedValueOnce(responseFor([selection]));
    const clips = await generateClipSuggestions(transcript);
    expect(clips[0]).toMatchObject({ start: 430.25, end: 460.75 });
    expect(fetch).toHaveBeenCalledTimes(2);
    const bodies = vi.mocked(fetch).mock.calls.map(([, options]) => JSON.parse(options!.body as string));
    expect(bodies[1].prompt).toContain("S1–S1 (430.25–440.5 seconds)");
    expect(bodies[1].prompt).toContain("10.3 seconds");
    expect(bodies[1].format).toEqual(bodies[0].format);
    expect(bodies[1].model).toBe(bodies[0].model);
  });

  it("can succeed on the final permitted attempt", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(responseFor([{ ...selection, startSegmentId: "S999" }]))
      .mockResolvedValueOnce(responseFor([{ ...selection, endSegmentId: "S1" }]))
      .mockResolvedValueOnce(responseFor([selection]));
    await expect(generateClipSuggestions(transcript)).resolves.toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("reports exhausted attempts and the latest validation reason", async () => {
    respond([{ ...selection, endSegmentId: "S1" }]);
    await expect(generateClipSuggestions(transcript))
      .rejects.toThrow("Exhausted 3 attempts (2 retries).");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("accepts an explicit empty result on retry without further calls", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(responseFor([{ ...selection, endSegmentId: "S1" }]))
      .mockResolvedValueOnce(responseFor([]));
    await expect(generateClipSuggestions(transcript)).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("recovers from malformed JSON using validation feedback", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ response: "not JSON" })))
      .mockResolvedValueOnce(responseFor([selection]));
    await expect(generateClipSuggestions(transcript)).resolves.toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry transport failures", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("fetch failed"));
    await expect(generateClipSuggestions(transcript)).rejects.toThrow("fetch failed");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

});
