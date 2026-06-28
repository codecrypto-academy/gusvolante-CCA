import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";

export async function GET() {
  const db = await getDb();
  const tokens = await db.collection("tokens").find().toArray();
  return NextResponse.json(tokens);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = await getDb();
  const result = await db.collection("tokens").insertOne({
    ...body,
    createdAt: new Date(),
  });
  return NextResponse.json({ insertedId: result.insertedId }, { status: 201 });
}
