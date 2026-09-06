import type {
  ClipSuggestion,
} from "@/lib/contracts/clip";

export type AnalyzeDependencies = {
  runCommand(command: string): Promise<void>;

  fileExists(
    path: string,
  ): Promise<boolean>;

  createDirectory(
    path: string,
  ): Promise<void>;

  readTextFile(
    path: string,
  ): Promise<string>;

  generateClips(
    transcript: string,
  ): Promise<ClipSuggestion[]>;
};

export type AnalyzeResult = {
  transcript: string;
  clips: ClipSuggestion[];
};

function getYouTubeVideoId(url: string): string {
  const match = url.match(
    /(?:youtu\.be\/|v=)([^&?/]+)/,
  );

  return match?.[1] ?? crypto.randomUUID();
}

export async function analyzeVideo(
  url: string,
  dependencies: AnalyzeDependencies,
): Promise<AnalyzeResult> {
  const id = getYouTubeVideoId(url);

  const videoPath = `storage/videos/${id}.mp4`;
  const audioPath = `storage/audio/${id}.wav`;
  const transcriptPath =
    `storage/transcripts/${id}.txt`;

  await dependencies.createDirectory(
    "storage/videos",
  );

  await dependencies.createDirectory(
    "storage/audio",
  );

  await dependencies.createDirectory(
    "storage/transcripts",
  );

  if (
    !(await dependencies.fileExists(videoPath))
  ) {
    await dependencies.runCommand(
      `yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best" ` +
        `--merge-output-format mp4 ` +
        `-o "${videoPath}" "${url}"`,
    );
  } else {
    console.log(
      "Video already exists. Skipping download.",
    );
  }

  if (
    !(await dependencies.fileExists(audioPath))
  ) {
    await dependencies.runCommand(
      `ffmpeg -y -i "${videoPath}" ` +
        `-ar 16000 -ac 1 "${audioPath}"`,
    );
  } else {
    console.log(
      "Audio already exists. Skipping extraction.",
    );
  }

  if (
    !(await dependencies.fileExists(transcriptPath))
  ) {
    await dependencies.runCommand(
      `python3 scripts/transcribe.py ` +
        `"${audioPath}" "${transcriptPath}"`,
    );
  } else {
    console.log(
      "Transcript already exists. Skipping transcription.",
    );
  }

  const transcript =
    await dependencies.readTextFile(transcriptPath);

  const clips =
    await dependencies.generateClips(transcript);

  return {
    transcript,
    clips,
  };
}