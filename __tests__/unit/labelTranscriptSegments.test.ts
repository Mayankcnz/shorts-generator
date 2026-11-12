import { describe, expect, it } from "vitest";
import { labelTranscriptSegments } from "@/lib/labelTranscriptSegments";

describe("labelTranscriptSegments", () => {
  it("preserves decimal timestamps and spoken text", () => {
    expect(labelTranscriptSegments(
      "[430.00 - 433.25] Judges.\n[433.25 - 445.00] धन्यवाद।",
    )).toBe("S1 [430.00 - 433.25] Judges.\nS2 [433.25 - 445.00] धन्यवाद।");
  });

  it("labels inline segments and retains other bracketed text", () => {
    expect(labelTranscriptSegments("[0 - 15] [music] Yes. [15 - 30] No."))
      .toBe("S1 [0 - 15] [music] Yes. S2 [15 - 30] No.");
  });

  it("restarts IDs consistently for each request", () => {
    const input = "[0 - 20] Hello.";
    expect(labelTranscriptSegments(input)).toBe("S1 [0 - 20] Hello.");
    expect(labelTranscriptSegments(input)).toBe("S1 [0 - 20] Hello.");
    expect(labelTranscriptSegments("")).toBe("");
  });
});
