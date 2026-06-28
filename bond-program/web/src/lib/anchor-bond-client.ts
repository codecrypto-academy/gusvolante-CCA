import { Program, AnchorProvider, BN, Idl } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import idlJson from "../idl/bond_program.json";

const PROGRAM_ID = new PublicKey(idlJson.address);

export function getProgram(provider: AnchorProvider): Program {
  return new Program(idlJson as Idl, provider);
}

export function getListingPda(issuer: PublicKey, bondMint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("listing"), issuer.toBuffer(), bondMint.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getEscrowPda(listingPda: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), listingPda.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export async function initializeBondListing(
  program: Program,
  issuer: PublicKey,
  bondMint: PublicKey,
  stablecoinMint: PublicKey,
  bondAmount: number,
  pricePerBond: number
): Promise<string> {
  const listingPda = getListingPda(issuer, bondMint);
  const escrowPda = getEscrowPda(listingPda);
  const issuerBondAta = getAssociatedTokenAddressSync(bondMint, issuer);

  return await program.methods
    .initializeBondListing(new BN(bondAmount), new BN(pricePerBond))
    .accountsStrict({
      issuer,
      bondMint,
      stablecoinMint,
      listing: listingPda,
      escrow: escrowPda,
      issuerBondAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    } as any)
    .rpc();
}

export async function purchaseBonds(
  program: Program,
  buyer: PublicKey,
  issuer: PublicKey,
  bondMint: PublicKey,
  stablecoinMint: PublicKey,
  amount: number
): Promise<string> {
  const listingPda = getListingPda(issuer, bondMint);
  const escrowPda = getEscrowPda(listingPda);
  const buyerStablecoinAta = getAssociatedTokenAddressSync(stablecoinMint, buyer);
  const issuerStablecoinAta = getAssociatedTokenAddressSync(stablecoinMint, issuer);
  const buyerBondAta = getAssociatedTokenAddressSync(bondMint, buyer);

  return await program.methods
    .purchaseBonds(new BN(amount))
    .accountsStrict({
      buyer,
      listing: listingPda,
      escrow: escrowPda,
      buyerStablecoinAta,
      issuerStablecoinAta,
      buyerBondAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any)
    .rpc();
}

export async function cancelListing(
  program: Program,
  issuer: PublicKey,
  bondMint: PublicKey
): Promise<string> {
  const listingPda = getListingPda(issuer, bondMint);
  const escrowPda = getEscrowPda(listingPda);
  const issuerBondAta = getAssociatedTokenAddressSync(bondMint, issuer);

  return await program.methods
    .cancelListing()
    .accountsStrict({
      issuer,
      listing: listingPda,
      escrow: escrowPda,
      issuerBondAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any)
    .rpc();
}

export async function updatePrice(
  program: Program,
  issuer: PublicKey,
  bondMint: PublicKey,
  newPrice: number
): Promise<string> {
  const listingPda = getListingPda(issuer, bondMint);

  return await program.methods
    .updatePrice(new BN(newPrice))
    .accountsStrict({
      issuer,
      listing: listingPda,
    } as any)
    .rpc();
}

export async function addBondsToListing(
  program: Program,
  issuer: PublicKey,
  bondMint: PublicKey,
  additionalAmount: number
): Promise<string> {
  const listingPda = getListingPda(issuer, bondMint);
  const escrowPda = getEscrowPda(listingPda);
  const issuerBondAta = getAssociatedTokenAddressSync(bondMint, issuer);

  return await program.methods
    .addBondsToListing(new BN(additionalAmount))
    .accountsStrict({
      issuer,
      listing: listingPda,
      escrow: escrowPda,
      issuerBondAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any)
    .rpc();
}

export async function fetchListing(program: Program, listingPda: PublicKey) {
  try {
    return await (program.account as any).bondListing.fetch(listingPda);
  } catch {
    return null;
  }
}

export async function fetchAllListings(program: Program) {
  try {
    return await (program.account as any).bondListing.all();
  } catch {
    return [];
  }
}
