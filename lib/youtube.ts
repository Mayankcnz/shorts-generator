const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

export function isYouTubeUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      YOUTUBE_HOSTS.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

export function extractVideoId(value: string): string | null {
  
  const url = new URL(value);

  if(url.hostname === "youtu.be"){
    return url.pathname.slice(1) || null;
  }

    return url.searchParams.get("v");

}
