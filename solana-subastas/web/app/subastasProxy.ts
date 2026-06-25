"use client";
import { PublicKey, Connection, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, BN, Wallet } from "@coral-xyz/anchor";
import idlJson from "./idl/solana_subastas.json";
import bs58 from "bs58";

const PROGRAM_ID = new PublicKey(idlJson.address);
const RPC_URL = "http://127.0.0.1:8899";

function getProvider(wallet: Wallet) {
  const connection = new Connection(RPC_URL, "confirmed");
  return new AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function getProgram(wallet: Wallet): Program<any> {
  const provider = getProvider(wallet);
  return new Program(idlJson as any, provider);
}

function subastaSeeds(id: BN) {
  return [Buffer.from("subasta"), id.toArrayLike(Buffer, "le", 8)];
}

function pujaSeeds(id: BN, userKey: PublicKey) {
  return [Buffer.from("puja"), id.toArrayLike(Buffer, "le", 8), userKey.toBuffer()];
}

export async function getSubastas(wallet: Wallet) {
  const program = getProgram(wallet);
  const subastas = await (program.account as any).subasta.all();
  return subastas.map(({ account, publicKey }: any) => ({
    id: account.id.toString(),
    nombre: account.nombre,
    descripcion: account.descripcion,
    importeMinimo: account.importeMinimo.toString(),
    fechaInicio: account.fechaInicio.toString(),
    fechaFin: account.fechaFin.toString(),
    estado: Number(account.estado.toString()),
    publicKey: publicKey.toBase58(),
    creador: account.creador.toBase58(),
    ganador: account.ganador.toBase58(),
    importeGanador: account.importeGanador.toString(),
  }));
}

export async function createSubasta(
  wallet: Wallet,
  data: { nombre: string; descripcion: string; importeMinimo: string; fechaInicio: string; fechaFin: string }
) {
  const program = getProgram(wallet);
  const id = new BN(Date.now());
  const [subastaPda] = PublicKey.findProgramAddressSync(subastaSeeds(id), PROGRAM_ID);

  await program.methods
    .crearSubasta(id, data.nombre, data.descripcion, new BN(data.importeMinimo), new BN(data.fechaInicio), new BN(data.fechaFin))
    .accountsStrict({
      subasta: subastaPda,
      user: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
}

export async function iniciarSubasta(wallet: Wallet, id: string) {
  const program = getProgram(wallet);
  const bnId = new BN(id);
  const [subastaPda] = PublicKey.findProgramAddressSync(subastaSeeds(bnId), PROGRAM_ID);

  await program.methods
    .iniciarSubasta(bnId)
    .accountsStrict({ subasta: subastaPda, user: wallet.publicKey } as any)
    .rpc();
}

export async function crearPuja(
  wallet: Wallet,
  data: { id: string; importePuja: string }
) {
  const program = getProgram(wallet);
  const bnId = new BN(data.id);
  const [subastaPda] = PublicKey.findProgramAddressSync(subastaSeeds(bnId), PROGRAM_ID);
  const [pujaPda] = PublicKey.findProgramAddressSync(pujaSeeds(bnId, wallet.publicKey), PROGRAM_ID);

  await program.methods
    .crearPuja(bnId, new BN(data.importePuja), new BN(Math.floor(Date.now() / 1000)))
    .accountsStrict({
      subasta: subastaPda,
      puja: pujaPda,
      user: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
}

export async function finalizarSubasta(wallet: Wallet, id: string) {
  const program = getProgram(wallet);
  const bnId = new BN(id);
  const [subastaPda] = PublicKey.findProgramAddressSync(subastaSeeds(bnId), PROGRAM_ID);

  await program.methods
    .finalizarSubasta(bnId)
    .accountsStrict({ subasta: subastaPda, user: wallet.publicKey } as any)
    .rpc();
}

export async function getPujas(wallet: Wallet, subastaId: string) {
  const program = getProgram(wallet);
  const bnId = new BN(subastaId);
  const idBuffer = bnId.toArrayLike(Buffer, "le", 8);

  const pujas = await (program.account as any).puja.all([
    { memcmp: { offset: 8, bytes: bs58.encode(idBuffer) } },
  ]);

  return pujas.map(({ account, publicKey }: any) => ({
    id: account.id.toString(),
    importePuja: account.importePuja.toString(),
    ts: account.ts.toString(),
    pk: account.pk.toBase58(),
    publicKey: publicKey.toBase58(),
  }));
}
/* eslint-enable @typescript-eslint/no-explicit-any */
