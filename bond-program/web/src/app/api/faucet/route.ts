import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getConnection, getTreasuryKeypair, mintTokensTo } from "../../../lib/solana-client";

export async function POST(req: NextRequest) {
  try {
    const { mint, destination, amount } = await req.json();
    const connection = getConnection();
    const treasury = getTreasuryKeypair();

    const ata = await mintTokensTo(
      connection,
      treasury,
      new PublicKey(mint),
      new PublicKey(destination),
      Number(amount)
    );

    return NextResponse.json({ success: true, ata: ata.toString() });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
