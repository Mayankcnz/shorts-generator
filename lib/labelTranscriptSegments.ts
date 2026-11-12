export type TranscriptSegment = {
  id: string;
  start: number;
  end: number;
  text: string;
  timestamp: string;
};

/** One shared parser keeps prompt IDs and timestamp lookup in sync. */
export function parseTranscriptSegments(transcript: string): TranscriptSegment[] {
  const matches = [...transcript.matchAll(
    /\[\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*\]/g,
  )];
  return matches.map((match, index) => ({
    id: `S${index + 1}`,
    start: Number(match[1]),
    end: Number(match[2]),
    text: transcript.slice(
      match.index! + match[0].length,
      matches[index + 1]?.index ?? transcript.length,
    ).trim(),
    timestamp: match[0],
  }));
}

/** Add request-local segment IDs without changing source timestamps or text. */
export function labelTranscriptSegments(transcript: string): string {
  const segments = parseTranscriptSegments(transcript);
  let index = 0;
  return transcript.replace(
    /\[\s*\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*\]/g,
    (timestamp) => `${segments[index++].id} ${timestamp}`,
  );
}
