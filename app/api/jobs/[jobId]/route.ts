import { analysisJobRepository } from "@/lib/db/repositories";
import { serializeAnalysisJob } from "@/lib/jobs/serializeAnalysisJob";

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
