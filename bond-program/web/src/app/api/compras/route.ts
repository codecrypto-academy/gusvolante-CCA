import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const db = await getDb();
  const filter = wallet ? { compradorWallet: wallet } : {};
  const compras = await db
    .collection("compras")
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json(compras);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = await getDb();

  const result = await db.collection("compras").insertOne({
    ...body,
    createdAt: new Date(),
  });

  // Update bonistas
  await db.collection("bonistas").updateOne(
    { tokenMint: body.bonoMint, walletAddress: body.compradorWallet },
    {
      $inc: { amount: body.cantidad },
      $set: { averagePrice: body.precioUnitario },
    },
    { upsert: true }
  );

  return NextResponse.json({ insertedId: result.insertedId }, { status: 201 });
}
