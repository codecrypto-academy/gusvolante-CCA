import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";

export async function GET(req: NextRequest) {
  const bonoMint = req.nextUrl.searchParams.get("bonoMint");
  const db = await getDb();
  const filter = bonoMint ? { bonoMint } : {};
  const pagos = await db
    .collection("pagos_cupones")
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json(pagos);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = await getDb();
  const result = await db.collection("pagos_cupones").insertOne({
    ...body,
    createdAt: new Date(),
  });
  return NextResponse.json({ insertedId: result.insertedId }, { status: 201 });
}
