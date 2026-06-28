import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BondProgram } from "../target/types/bond_program";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccount,
  getAccount,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";

async function main() {
  const bondMintStr = process.env.BOND_MINT;
  const stablecoinMintStr = process.env.STABLECOIN_MINT;
  const bondAmount = Number(process.env.BOND_AMOUNT || "5000");
  const pricePerBond = Number(process.env.PRICE_PER_BOND || "100");

  if (!bondMintStr || !stablecoinMintStr) {
    console.error("BOND_MINT and STABLECOIN_MINT env vars required");
    process.exit(1);
  }

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.bondProgram as Program<BondProgram>;
  const issuer = provider.wallet.publicKey;

  const bondMint = new PublicKey(bondMintStr);
  const stablecoinMint = new PublicKey(stablecoinMintStr);

  const [listingPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("listing"), issuer.toBuffer(), bondMint.toBuffer()],
    program.programId
  );
  const [escrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), listingPda.toBuffer()],
    program.programId
  );
  const issuerBondAta = getAssociatedTokenAddressSync(bondMint, issuer);

  console.log(`Creating listing: ${bondAmount} bonds at ${pricePerBond} per bond`);
  console.log(`  Issuer: ${issuer.toString()}`);
  console.log(`  Bond mint: ${bondMintStr}`);
  console.log(`  Stablecoin mint: ${stablecoinMintStr}`);

  const tx = await program.methods
    .initializeBondListing(
      new anchor.BN(bondAmount),
      new anchor.BN(pricePerBond)
    )
    .accountsStrict({
      issuer,
      bondMint,
      stablecoinMint,
      listing: listingPda,
      escrow: escrowPda,
      issuerBondAta,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  console.log(`  Listing created! Tx: ${tx}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
