import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BondProgram } from "../target/types/bond_program";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccount,
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("bond-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.bondProgram as Program<BondProgram>;

  const issuer = Keypair.generate();
  const buyer = Keypair.generate();

  let bondMint: PublicKey;
  let stablecoinMint: PublicKey;
  let issuerBondAta: PublicKey;
  let issuerStablecoinAta: PublicKey;
  let buyerBondAta: PublicKey;
  let buyerStablecoinAta: PublicKey;
  let listingPda: PublicKey;
  let escrowPda: PublicKey;

  const BOND_AMOUNT = 1000;
  const PRICE_PER_BOND = 100;

  before(async () => {
    // Airdrop to issuer and buyer
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(issuer.publicKey, 10e9)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(buyer.publicKey, 10e9)
    );

    // Create mints
    bondMint = await createMint(
      provider.connection,
      issuer,
      issuer.publicKey,
      null,
      0
    );
    stablecoinMint = await createMint(
      provider.connection,
      issuer,
      issuer.publicKey,
      null,
      0
    );

    // Create ATAs
    issuerBondAta = await createAssociatedTokenAccount(
      provider.connection,
      issuer,
      bondMint,
      issuer.publicKey
    );
    issuerStablecoinAta = await createAssociatedTokenAccount(
      provider.connection,
      issuer,
      stablecoinMint,
      issuer.publicKey
    );
    buyerBondAta = await createAssociatedTokenAccount(
      provider.connection,
      buyer,
      bondMint,
      buyer.publicKey
    );
    buyerStablecoinAta = await createAssociatedTokenAccount(
      provider.connection,
      buyer,
      stablecoinMint,
      buyer.publicKey
    );

    // Mint bonds to issuer, stablecoins to buyer
    await mintTo(
      provider.connection,
      issuer,
      bondMint,
      issuerBondAta,
      issuer,
      BOND_AMOUNT
    );
    await mintTo(
      provider.connection,
      issuer,
      stablecoinMint,
      buyerStablecoinAta,
      issuer,
      PRICE_PER_BOND * BOND_AMOUNT
    );

    // Derive PDAs
    [listingPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("listing"), issuer.publicKey.toBuffer(), bondMint.toBuffer()],
      program.programId
    );
    [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), listingPda.toBuffer()],
      program.programId
    );
  });

  it("Should initialize bond listing", async () => {
    await program.methods
      .initializeBondListing(new anchor.BN(BOND_AMOUNT), new anchor.BN(PRICE_PER_BOND))
      .accountsStrict({
        issuer: issuer.publicKey,
        bondMint,
        stablecoinMint,
        listing: listingPda,
        escrow: escrowPda,
        issuerBondAta,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([issuer])
      .rpc();

    const listing = await program.account.bondListing.fetch(listingPda);
    assert.ok(listing.issuer.equals(issuer.publicKey));
    assert.ok(listing.bondMint.equals(bondMint));
    assert.ok(listing.stablecoinMint.equals(stablecoinMint));
    assert.equal(listing.bondAmount.toNumber(), BOND_AMOUNT);
    assert.equal(listing.pricePerBond.toNumber(), PRICE_PER_BOND);
    assert.equal(listing.isActive, true);

    const escrowAccount = await getAccount(provider.connection, escrowPda);
    assert.equal(Number(escrowAccount.amount), BOND_AMOUNT);
  });

  it("Should update price", async () => {
    const newPrice = 150;
    await program.methods
      .updatePrice(new anchor.BN(newPrice))
      .accountsStrict({
        issuer: issuer.publicKey,
        listing: listingPda,
      })
      .signers([issuer])
      .rpc();

    const listing = await program.account.bondListing.fetch(listingPda);
    assert.equal(listing.pricePerBond.toNumber(), newPrice);

    // Restore original price for next tests
    await program.methods
      .updatePrice(new anchor.BN(PRICE_PER_BOND))
      .accountsStrict({
        issuer: issuer.publicKey,
        listing: listingPda,
      })
      .signers([issuer])
      .rpc();
  });

  it("Should purchase bonds", async () => {
    const purchaseAmount = 100;
    const expectedCost = purchaseAmount * PRICE_PER_BOND;

    await program.methods
      .purchaseBonds(new anchor.BN(purchaseAmount))
      .accountsStrict({
        buyer: buyer.publicKey,
        listing: listingPda,
        escrow: escrowPda,
        buyerStablecoinAta,
        issuerStablecoinAta,
        buyerBondAta,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    const listing = await program.account.bondListing.fetch(listingPda);
    assert.equal(listing.bondAmount.toNumber(), BOND_AMOUNT - purchaseAmount);

    const buyerBonds = await getAccount(provider.connection, buyerBondAta);
    assert.equal(Number(buyerBonds.amount), purchaseAmount);

    const issuerStables = await getAccount(provider.connection, issuerStablecoinAta);
    assert.equal(Number(issuerStables.amount), expectedCost);
  });

  it("Should add bonds to listing", async () => {
    const additionalBonds = 500;
    // Mint more bonds to issuer first
    await mintTo(
      provider.connection,
      issuer,
      bondMint,
      issuerBondAta,
      issuer,
      additionalBonds
    );

    await program.methods
      .addBondsToListing(new anchor.BN(additionalBonds))
      .accountsStrict({
        issuer: issuer.publicKey,
        listing: listingPda,
        escrow: escrowPda,
        issuerBondAta,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .signers([issuer])
      .rpc();

    const listing = await program.account.bondListing.fetch(listingPda);
    assert.equal(listing.bondAmount.toNumber(), BOND_AMOUNT - 100 + additionalBonds);
  });

  it("Should fail purchase when not enough bonds", async () => {
    try {
      await program.methods
        .purchaseBonds(new anchor.BN(99999))
        .accountsStrict({
          buyer: buyer.publicKey,
          listing: listingPda,
          escrow: escrowPda,
          buyerStablecoinAta,
          issuerStablecoinAta,
          buyerBondAta,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();
      assert.fail("Should have thrown InsufficientBonds");
    } catch (err) {
      assert.include(err.toString(), "InsufficientBonds");
    }
  });

  it("Should cancel listing and return bonds", async () => {
    const listingBefore = await program.account.bondListing.fetch(listingPda);
    const bondsInEscrow = listingBefore.bondAmount.toNumber();

    const issuerBondsBefore = await getAccount(provider.connection, issuerBondAta);

    await program.methods
      .cancelListing()
      .accountsStrict({
        issuer: issuer.publicKey,
        listing: listingPda,
        escrow: escrowPda,
        issuerBondAta,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .signers([issuer])
      .rpc();

    const listing = await program.account.bondListing.fetch(listingPda);
    assert.equal(listing.bondAmount.toNumber(), 0);
    assert.equal(listing.isActive, false);

    const issuerBondsAfter = await getAccount(provider.connection, issuerBondAta);
    assert.equal(
      Number(issuerBondsAfter.amount) - Number(issuerBondsBefore.amount),
      bondsInEscrow
    );
  });
});
