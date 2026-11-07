import { analysisJobRepository } from "@/lib/db/repositories";
import { isYouTubeUrl } from "@/lib/youtube";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "A valid JSON request body is required." },
      { status: 400 },
    );
  }

  const url =
    typeof body === "object" && body !== null && "url" in body
      ? body.url
      : undefined;

  if (!isYouTubeUrl(url)) {
    return Response.json(
      { error: "A valid HTTPS YouTube URL is required." },
      { status: 400 },
    );
  }

  try {
    const job = await analysisJobRepository.create(url);

    return Response.json(
      { jobId: job.id, status: job.status },
      {
        status: 202,
        headers: { Location: `/api/jobs/${job.id}` },
      },
    );
  } catch (error) {
    console.error("Failed to create analysis job", error);
    return Response.json(
      { error: "Unable to create the analysis job." },
      { status: 500 },
    );
  }
}
