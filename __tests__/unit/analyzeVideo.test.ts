import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ClipSuggestion,
} from "@/lib/contracts/clip";

import {
  analyzeVideo,
  type AnalyzeDependencies,
} from "@/lib/analyzeVideo";

describe("analyzeVideo", () => {
  it("processes a video and returns the transcript and clips", async () => {
    // We will arrange the fake dependencies here.

    // Arrange
const expectedTranscript =
  "[0 - 60] This is an example transcript.";

const expectedClips: ClipSuggestion[] = [
  {
    title: "Example clip",
    start: 0,
    end: 30,
    score: 9,
    hook: "This is an example hook.",
    whyItWorks: "It has a clear setup and payoff.",
    storyType: "story",
  },
];

const runCommand =
  vi.fn<AnalyzeDependencies["runCommand"]>()
    .mockResolvedValue(undefined);

const fileExists =
  vi.fn<AnalyzeDependencies["fileExists"]>()
    .mockResolvedValue(false);

const createDirectory =
  vi.fn<AnalyzeDependencies["createDirectory"]>()
    .mockResolvedValue(undefined);

const readTextFile =
  vi.fn<AnalyzeDependencies["readTextFile"]>()
    .mockResolvedValue(expectedTranscript);

const generateClips =
  vi.fn<AnalyzeDependencies["generateClips"]>()
    .mockResolvedValue(expectedClips);

const dependencies: AnalyzeDependencies = {
  runCommand,
  fileExists,
  createDirectory,
  readTextFile,
  generateClips,
};

const result = await analyzeVideo(
  "https://www.youtube.com/watch?v=abc123",
  dependencies,
);

// Assert: final result
expect(result).toEqual({
  transcript: expectedTranscript,
  clips: expectedClips,
});

// Assert: directories
expect(createDirectory).toHaveBeenNthCalledWith(
  1,
  "storage/videos",
);

expect(createDirectory).toHaveBeenNthCalledWith(
  2,
  "storage/audio",
);

expect(createDirectory).toHaveBeenNthCalledWith(
  3,
  "storage/transcripts",
);

// Assert: file checks
expect(fileExists).toHaveBeenNthCalledWith(
  1,
  "storage/videos/abc123.mp4",
);

expect(fileExists).toHaveBeenNthCalledWith(
  2,
  "storage/audio/abc123.wav",
);

expect(fileExists).toHaveBeenNthCalledWith(
  3,
  "storage/transcripts/abc123.txt",
);

// Assert: external commands
expect(runCommand).toHaveBeenCalledTimes(3);

expect(runCommand).toHaveBeenNthCalledWith(
  1,
  expect.stringContaining("yt-dlp"),
);

expect(runCommand).toHaveBeenNthCalledWith(
  2,
  expect.stringContaining("ffmpeg"),
);

expect(runCommand).toHaveBeenNthCalledWith(
  3,
  expect.stringContaining("python3"),
);

// Assert: final processing
expect(readTextFile).toHaveBeenCalledWith(
  "storage/transcripts/abc123.txt",
);

expect(generateClips).toHaveBeenCalledWith(
  expectedTranscript,
);


  });

  it("reuses existing video, audio, and transcript files", async () => {
  //;]/ Arrange
  const expectedTranscript =
    "[0 - 60] Existing transcript.";

  const expectedClips: ClipSuggestion[] = [
    {
      title: "Existing clip",
      start: 0,
      end: 30,
      score: 8,
      hook: "Existing hook",
      whyItWorks: "It contains a useful section.",
      storyType: "story",
    },
  ];
const runCommand =
  vi.fn<AnalyzeDependencies["runCommand"]>()
    .mockResolvedValue(undefined);

const fileExists =
  vi.fn<AnalyzeDependencies["fileExists"]>()
    .mockResolvedValue(true);

const createDirectory =
  vi.fn<AnalyzeDependencies["createDirectory"]>()
    .mockResolvedValue(undefined);

const readTextFile =
  vi.fn<AnalyzeDependencies["readTextFile"]>()
    .mockResolvedValue(expectedTranscript);

const generateClips =
  vi.fn<AnalyzeDependencies["generateClips"]>()
    .mockResolvedValue(expectedClips);

  const dependencies: AnalyzeDependencies = {
    runCommand,
    fileExists,
    createDirectory,
    readTextFile,
    generateClips,
  };

  // Act
  const result = await analyzeVideo(
    "https://www.youtube.com/watch?v=abc123",
    dependencies,
  );

  // Assert
  expect(runCommand).not.toHaveBeenCalled();

  expect(readTextFile).toHaveBeenCalledWith(
    "storage/transcripts/abc123.txt",
  );

  expect(generateClips).toHaveBeenCalledWith(
    expectedTranscript,
  );

  expect(result).toEqual({
    transcript: expectedTranscript,
    clips: expectedClips,
  });
});


});