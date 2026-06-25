import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaSubastas } from "../target/types/solana_subastas";
import assert from "assert";

describe("solana-subastas", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();
  const program = anchor.workspace.solanaSubastas as Program<SolanaSubastas>;

  const subastaId = new anchor.BN(Math.floor(Math.random() * 1_000_000) + 1);
  const now = Math.floor(Date.now() / 1000);

  const [subastaPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("subasta"), Buffer.from(subastaId.toArray("le", 8))],
    program.programId
  );

  const [pujaPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("puja"),
      Buffer.from(subastaId.toArray("le", 8)),
      provider.wallet.publicKey.toBuffer(),
    ],
    program.programId
  );

  it("Crear subasta", async () => {
    const tx = await program.methods
      .crearSubasta(
        subastaId,
        "Ordenador",
        "16 GB RAM, 500GB DISCO",
        new anchor.BN(870),
        new anchor.BN(now),
        new anchor.BN(now + 3600)
      )
      .accountsStrict({
        subasta: subastaPda,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    assert.ok(tx);

    const subasta = await program.account.subasta.fetch(subastaPda);
    assert.equal(subasta.nombre, "Ordenador");
    assert.equal(subasta.descripcion, "16 GB RAM, 500GB DISCO");
    assert.equal(subasta.importeMinimo.toNumber(), 870);
    assert.equal(subasta.estado.toNumber(), 0);
  });

  it("Iniciar subasta", async () => {
    const tx = await program.methods
      .iniciarSubasta(subastaId)
      .accountsStrict({
        subasta: subastaPda,
        user: provider.wallet.publicKey,
      })
      .rpc();

    assert.ok(tx);

    const subasta = await program.account.subasta.fetch(subastaPda);
    assert.equal(subasta.estado.toNumber(), 1);
  });

  it("Iniciar subasta ya iniciada - debe fallar", async () => {
    try {
      await program.methods
        .iniciarSubasta(subastaId)
        .accountsStrict({
          subasta: subastaPda,
          user: provider.wallet.publicKey,
        })
        .rpc();
      assert.fail("Debería haber fallado");
    } catch (error) {
      assert.ok(error);
    }
  });

  it("Crear puja", async () => {
    const tx = await program.methods
      .crearPuja(
        subastaId,
        new anchor.BN(880),
        new anchor.BN(now + 10)
      )
      .accountsStrict({
        subasta: subastaPda,
        puja: pujaPda,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    assert.ok(tx);

    const puja = await program.account.puja.fetch(pujaPda);
    assert.equal(puja.importePuja.toNumber(), 880);
    assert.equal(puja.pk.toBase58(), provider.wallet.publicKey.toBase58());

    const subasta = await program.account.subasta.fetch(subastaPda);
    assert.equal(subasta.importeGanador.toNumber(), 880);
    assert.equal(subasta.ganador.toBase58(), provider.wallet.publicKey.toBase58());
  });

  it("Finalizar subasta", async () => {
    const tx = await program.methods
      .finalizarSubasta(subastaId)
      .accountsStrict({
        subasta: subastaPda,
        user: provider.wallet.publicKey,
      })
      .rpc();

    assert.ok(tx);

    const subasta = await program.account.subasta.fetch(subastaPda);
    assert.equal(subasta.estado.toNumber(), 2);
  });

  it("Obtener todas las subastas", async () => {
    const subastas = await program.account.subasta.all();
    assert.ok(subastas.length >= 1);
    console.log(`  Total subastas: ${subastas.length}`);
    for (const s of subastas) {
      console.log(`  - ${s.account.nombre} (ID: ${s.account.id}, Estado: ${s.account.estado})`);
    }
  });
});
