import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/analyze/route";




const mocks = vi.hoisted(() => ({
  analyzeVideo: vi.fn(),
}));

vi.mock("@/lib/analyzeVideo", () => ({
  analyzeVideo: mocks.analyzeVideo,
}));


/**
 * POST is the route-handler function we want to test.
 * expect lets us compare the actual response with the expected result.
 */
describe("POST /api/analyze integration", () => {

  beforeEach(() => {
  vi.clearAllMocks();
  });

  
  it("returns 400 when the request does not contain a YouTube URL", async () => {
  // Test implementation goes here
  const request = new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: {
    "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
});

  const response = await POST(request);
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body).toEqual({
      error: "Missing YouTube URL",
    });

  expect(mocks.analyzeVideo).not.toHaveBeenCalled();
  });

  it(
  "runs the video-processing workflow and returns the transcript and clips",
  async () => {
    // Arrange
    const expectedTranscript =
      "[0 - 60] This is an example transcript.";

    const expectedClips = [
      {
        title: "Example clip",
        start: 0,
        end: 30,
        score: 9,
        hook: "This is an example hook.",
        whyItWorks: "It contains a clear setup and payoff.",
        storyType: "story",
      },
    ];

    mocks.analyzeVideo.mockResolvedValue({
    transcript: expectedTranscript,
    clips: expectedClips,
    });

    const request = new Request(
      "http://localhost/api/analyze",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: "https://www.youtube.com/watch?v=abc123",
        }),
      },
    );

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert: response
    // expect(response.status).toBe(200);

    expect(response.status).toBe(200);
    
    expect(body).toEqual({
      transcript: expectedTranscript,
      clips: expectedClips,
    });

    // Assert: interactions
    expect(mocks.analyzeVideo).toHaveBeenCalledTimes(1);

    expect(mocks.analyzeVideo).toHaveBeenCalledWith(
  "https://www.youtube.com/watch?v=abc123",
  expect.anything(),
);

  },
);

  it.todo("returns 500 when the video-processing workflow fails");
});
