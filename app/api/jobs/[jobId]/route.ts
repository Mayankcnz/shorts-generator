import { analysisJobRepository } from "@/lib/db/repositories";
import { serializeAnalysisJob } from "@/lib/jobs/serializeAnalysisJob";
import { isYouTubeUrl } from "@/lib/youtube";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/jobs/[jobId]">,
) {
  const { jobId } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId)) {
    return Response.json(
      { error: "A valid job ID is required." },
      { status: 400 },
    );
  }

  try {
    const result = await analysisJobRepository.findById(jobId);

    if (!result) {
      return Response.json(
        { error: "Analysis job not found." },
        { status: 404 },
      );
    }

    return Response.json(serializeAnalysisJob(result), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to retrieve analysis job", error);
    return Response.json(
      { error: "Unable to retrieve the analysis job." },
      { status: 500 },
    );
  }
}
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

  try {
    const url =
      typeof body === "object" &&
      body !== null &&
      "url" in body
        ? body.url
        : undefined;

    if (!isYouTubeUrl(url)) {
      return Response.json(
        {
          error:
            "A valid HTTPS YouTube URL is required.",
        },
        { status: 400 },
      );
    }

    const job =
      await analysisJobRepository.create(url);

    return Response.json(
      {
        jobId: job.id,
        status: job.status,
      },
      {
        status: 202,
        headers: {
          Location: `/api/jobs/${job.id}`,
        },
      },
    );
  } catch (error) {
    console.error(
      "Failed to create analysis job",
      error,
    );

    return Response.json(
      {
        error:
          "Unable to create the analysis job.",
      },
      { status: 500 },
    );
  }
}



