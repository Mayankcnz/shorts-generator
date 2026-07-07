import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import { generateClipSuggestions } from "@/lib/generateClipSuggestions";

const execAsync = promisify(exec);

function getYouTubeVideoId(url: string) {
  const match = url.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
  return match?.[1] || crypto.randomUUID();
}

async function fileExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing YouTube URL" }, { status: 400 });
    }

    const id = getYouTubeVideoId(url);

    const videoPath = `storage/videos/${id}.mp4`;
    const audioPath = `storage/audio/${id}.wav`;
    const transcriptPath = `storage/transcripts/${id}.txt`;

    await fs.mkdir("storage/videos", { recursive: true });
    await fs.mkdir("storage/audio", { recursive: true });
    await fs.mkdir("storage/transcripts", { recursive: true });

    if (!(await fileExists(videoPath))) {
      await execAsync(
        `yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best" --merge-output-format mp4 -o "${videoPath}" "${url}"`
      );
    } else {
      console.log("Video already exists. Skipping download.");
    }

    if (!(await fileExists(audioPath))) {
      await execAsync(
        `ffmpeg -y -i "${videoPath}" -ar 16000 -ac 1 "${audioPath}"`
      );
    } else {
      console.log("Audio already exists. Skipping extraction.");
    }

    if (!(await fileExists(transcriptPath))) {
      await execAsync(
        `python3 scripts/transcribe.py "${audioPath}" "${transcriptPath}"`
      );
    } else {
      console.log("Transcript already exists. Skipping transcription.");
    }

    const transcript = await fs.readFile(transcriptPath, "utf-8");
    const clips = await generateClipSuggestions(transcript);

    return NextResponse.json({ transcript, clips });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong while analyzing the video." },
      { status: 500 }
    );
  }
}