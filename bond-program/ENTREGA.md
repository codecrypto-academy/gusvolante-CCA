# Bond dApp — Entrega Master Blockchain 360 (CodeCrypto Academy)

## Autor
- **Nombre:** Gus Volante
- **Email:** gus.volante@gmail.com
- **Academia:** CodeCrypto Academy — Master Ingeniería Blockchain 360
- **Profesor:** @joseviejo

## Video demo
https://www.loom.com/share/4abb465d4f9c4ccea2fcdc9fd2aeda0c

## Descripción
dApp de bonos de deuda descentralizada en Solana. Permite crear stablecoins y bonos (tokens SPL),
listarlos para venta en un marketplace con escrow on-chain, y realizar compras atómicas
(stablecoins → emisor + bonos → comprador en una sola transacción).

## Stack técnico
- **Programa on-chain:** Anchor 0.31.1 (Rust) + anchor-spl (SPL Token CPI)
- **Frontend:** Next.js 16.2.9 (TypeScript, Turbopack)
- **Base de datos:** MongoDB 8.0 (metadatos de tokens, bonistas, compras)
- **Wallet:** Phantom (Solana wallet-adapter)
- **Entorno:** WSL2 Ubuntu 24.04, Solana CLI 2.1.x

## Programa Anchor — 5 instrucciones

| Instrucción | Descripción |
|---|---|
| `initialize_bond_listing` | Crea un listing, transfiere bonos del emisor al escrow PDA |
| `purchase_bonds` | Compra atómica: buyer paga stablecoins al emisor, escrow envía bonos al buyer |
| `cancel_listing` | Devuelve bonos del escrow al emisor, desactiva listing |
| `update_price` | Actualiza precio por bono (solo emisor) |
| `add_bonds_to_listing` | Agrega más bonos al escrow de un listing activo |

### Detalles técnicos
- **PDAs:** Listing `[b"listing", issuer, bond_mint]`, Escrow `[b"escrow", listing_pda]`
- **Escrow pattern:** TokenAccount PDA cuyo authority es el listing PDA — solo el programa puede firmar
- **Compra atómica:** 2 CPI `token::transfer` en 1 instrucción (stablecoins→emisor + bonos→comprador)
- **Tests:** 6/6 passing (5 instrucciones + 1 caso de error)

## Frontend — 7 páginas + API REST

| Página | Función |
|---|---|
| Home (`/`) | Conexión wallet + guía de uso |
| Tokens (`/tokens`) | Lista stablecoins y bonos registrados |
| Detalle (`/tokens/[mint]`) | Info del token, listing activo, comprar bonos, panel emisor |
| Crear Token (`/create-token`) | Registrar stablecoin o bono en MongoDB |
| Mis Bonos (`/my-bonds`) | Tenencias del usuario conectado |
| Historial (`/history`) | Compras realizadas con link a tx |
| Faucet (`/faucet`) | Mintear tokens de prueba (localnet) |

### API routes
- `GET/POST /api/tokens` — CRUD de tokens
- `GET /api/bonistas/[bonoMint]` — Bonistas por mint
- `GET/POST /api/compras` — Historial de compras
- `GET/POST /api/pagos-cupones` — Pagos de cupones
- `POST /api/faucet` — Mintear tokens de prueba

### MongoDB — 4 colecciones
`tokens`, `bonistas`, `compras`, `pagos_cupones`

## Cómo reproducir el entorno

### Prerequisitos
- WSL2 Ubuntu 24.04 con: Rust, Solana CLI, Anchor CLI (avm), Node.js, MongoDB 8.0
- Phantom wallet con Solana Localnet activado

### Setup completo (1 comando)
```bash
cd ~/proyectos/bond-program && bash setup.sh
```

El script `setup.sh` ejecuta 10 pasos automáticamente:
1. Verifica/levanta MongoDB
2. Levanta validador Solana local (reset limpio)
3. Verifica keypair
4. Airdrop SOL al admin
5. `anchor build` + `anchor deploy` (auto-actualiza Program ID)
6. Crea mints de prueba (stablecoin + bond) + mintea al admin
7. Fondea wallet Phantom (5 SOL + 100k USDC + 1k BCCA)
8. Registra tokens en MongoDB
9. Crea listing on-chain (5000 bonos @ 100 USDC)
10. Genera `.env.local` del frontend

### Levantar frontend
```bash
cd web && npm run dev -- --port 3000 --hostname 0.0.0.0
```

### Correr tests
```bash
anchor test
```
> Nota: no correr con el validador del setup activo (puerto 8899 ocupado).
> El `anchor test` levanta su propio validador temporal.

## Diferencias vs profesor
- Repo del profesor está **vacío** — proyecto construido 100% desde cero
- `setup.sh` automatiza todo el entorno (el profesor no incluye script)
- UI profesional con tema oscuro e inline styles
- Panel de emisor en detalle del bono (crear listing, actualizar precio, agregar bonos, cancelar)
