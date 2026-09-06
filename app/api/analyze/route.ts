import { NextResponse } from "next/server";
import { analyzeVideo } from "@/lib/analyzeVideo";
import {
  realAnalyzeDependencies,
} from "@/lib/realAnalyzeDependencies";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing YouTube URL" }, { status: 400 });
    }

    const result = await analyzeVideo(url, realAnalyzeDependencies)

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong while analyzing the video." },
      { status: 500 }
    );
  }
}