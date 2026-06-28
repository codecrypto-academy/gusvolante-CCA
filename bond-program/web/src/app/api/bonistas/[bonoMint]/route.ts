import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bonoMint: string }> }
) {
  const { bonoMint } = await params;
  const db = await getDb();
  const bonistas = await db
    .collection("bonistas")
    .find({ tokenMint: bonoMint })
    .toArray();
  return NextResponse.json(bonistas);
}
