import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Deepgram API key" },
        { status: 500 }
      );
    }

    return NextResponse.json({ key: apiKey });
  } catch (err) {
    console.error("Error generating Deepgram token:", err);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
