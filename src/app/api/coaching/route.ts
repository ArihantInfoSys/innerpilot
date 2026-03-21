import { NextResponse } from "next/server";
import { generateCoaching } from "@/lib/coaching-engine";
import { EmotionValues } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const values: EmotionValues = {
      anxiety: body.anxiety,
      confidence: body.confidence,
      focus: body.focus,
      frustration: body.frustration,
      motivation: body.motivation,
      energy: body.energy,
      fear: body.fear,
      excitement: body.excitement,
    };

    const coaching = generateCoaching(values);
    return NextResponse.json(coaching);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
