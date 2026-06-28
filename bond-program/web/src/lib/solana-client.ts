import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
} from "@solana/spl-token";
import bs58 from "bs58";

export const CLUSTER_URL = process.env.NEXT_PUBLIC_CLUSTER_URL || "http://localhost:8899";

export function getConnection() {
  return new Connection(CLUSTER_URL, "confirmed");
}

export function getTreasuryKeypair(): Keypair {
  const key = process.env.TREASURY_WALLET_PRIVATE_KEY;
  if (!key) throw new Error("TREASURY_WALLET_PRIVATE_KEY not set");
  return Keypair.fromSecretKey(bs58.decode(key));
}

export async function createSplToken(
  connection: Connection,
  payer: Keypair,
  decimals: number
): Promise<PublicKey> {
  return await createMint(connection, payer, payer.publicKey, null, decimals);
}

export async function mintTokensTo(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  destination: PublicKey,
  amount: number
) {
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    destination
  );
  await mintTo(connection, payer, mint, ata.address, payer, amount);
  return ata.address;
}

export async function transferTokens(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  from: PublicKey,
  to: PublicKey,
  amount: number
) {
  const fromAta = getAssociatedTokenAddressSync(mint, from);
  const toAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    to
  );
  await transfer(connection, payer, fromAta, toAta.address, payer, amount);
}

export async function getTokenBalance(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey
): Promise<number> {
  try {
    const ata = getAssociatedTokenAddressSync(mint, owner);
    const account = await getAccount(connection, ata);
    return Number(account.amount);
  } catch {
    return 0;
  }
}
