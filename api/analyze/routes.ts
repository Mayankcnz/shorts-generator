import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing YouTube URL" }, { status: 400 });
    }

    const id = uuidv4();

    const videoPath = `storage/videos/${id}.mp4`;
    const audioPath = `storage/audio/${id}.wav`;
    const transcriptPath = `storage/transcripts/${id}.txt`;

    await fs.mkdir("storage/videos", { recursive: true });
    await fs.mkdir("storage/audio", { recursive: true });
    await fs.mkdir("storage/transcripts", { recursive: true });
    
    await execAsync(
        `yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best" --merge-output-format mp4 -o "${videoPath}" "${url}"`
    );

    await execAsync(
      `ffmpeg -y -i "${videoPath}" -ar 16000 -ac 1 "${audioPath}"`
    );

    await execAsync(
      `python3 scripts/transcribe.py "${audioPath}" "${transcriptPath}"`
    );

    const transcript = await fs.readFile(transcriptPath, "utf-8");

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while analyzing the video." },
      { status: 500 }
    );
  }
}