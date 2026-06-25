# Entrega: Solana Subastas — Master Blockchain 360

**Alumno:** Gus Volante (gus.volante@gmail.com)
**Academia:** CodeCrypto Academy — Master Ingeniería Blockchain 360
**Profesor:** @joseviejo
**Fecha:** 2026-06-24

---

## Descripción del proyecto

Sistema de subastas descentralizado sobre la blockchain de Solana, implementado desde cero
siguiendo la GUIA_ESTUDIANTE del curso. Permite crear subastas con parámetros personalizados,
pujar, visualizar el ganador y finalizar la subasta.

### Componentes

1. **Programa Anchor (Rust)** — `programs/solana-subastas/src/lib.rs`
   - 4 instrucciones: `crear_subasta`, `iniciar_subasta`, `crear_puja`, `finalizar_subasta`
   - 2 structs on-chain: `Subasta` (10 campos) y `Puja` (4 campos)
   - PDAs: seeds `b"subasta"` + id, `b"puja"` + id + user (1 puja por usuario por subasta)
   - 7 errores personalizados con validaciones de estado, permisos y datos
   - Program ID: `FgYc9CFaC3KnGniZ7ATrAvSX7PX4AspW225GUkYz8tcj`

2. **Frontend (Next.js 15 + React 19 + Tailwind v4)**  — `web/`
   - Login con Phantom wallet
   - Dashboard: lista de subastas con acciones (crear, iniciar, pujar, finalizar)
   - Detalle: información completa de la subasta + tabla de pujas realizadas
   - Control de permisos: solo el creador ve botones Iniciar/Finalizar

3. **Tests de integración (TypeScript)** — `tests/solana-subastas.ts`
   - 6 tests: crear, iniciar, iniciar duplicado (falla), crear puja, finalizar, obtener todas
   - `anchor test` → 6/6 passing

### Diferencias con el repo del profesor

| Aspecto | Profesor (`solana-subasta`) | Mi implementación (`solana-subastas`) |
|---|---|---|
| Seeds PDA subasta | `b"subasta33"` | `b"subasta"` |
| Seeds PDA puja | `b"puja2222"` | `b"puja"` |
| Validación estado para pujar | No valida | `require!(estado == 1)` |
| Validación importe mínimo | No valida | `require!(importe >= minimo)` |
| Validación creador iniciar/finalizar | No valida | `require!(creador == signer)` |
| Validación fecha_fin > fecha_inicio | No valida | `require!(fecha_fin > fecha_inicio)` |
| Sysvar Rent en contexts | Incluye `rent: Sysvar<Rent>` | No (Anchor lo maneja automático) |
| Frontend | Next.js + inline styles | Next.js 15 + Tailwind v4 |
| Instrucción iniciar subasta | Solo creador (sin validación) | Solo creador (con validación explícita) |

---

## Cómo reproducir el entorno

### Requisitos previos
- WSL2 Ubuntu 24.04 (recomendado desde Windows)
- Rust 1.75+, Solana CLI 2.x, Anchor CLI 0.31.1 (vía `avm`), Node.js 18+, npm
- Phantom wallet (extensión de navegador)

### Setup automático
```bash
cd ~/proyectos/solana-subastas
bash setup.sh
```
Esto levanta el validador local, compila y despliega el programa, copia el IDL al frontend,
y fondea las wallets de Phantom.

### Levantar el frontend
```bash
cd web
npm install
npx next dev --port 3001 --hostname 0.0.0.0
```
Abrir `http://localhost:3001` (o `http://<WSL_IP>:3001` desde Windows).

### Configurar Phantom
1. Instalar extensión Phantom en Chrome/Brave
2. Developer Settings → Testnet Mode → activar
3. Seleccionar red **Solana Localnet** (`http://127.0.0.1:8899`)

### Flujo de demo
1. Conectar Phantom (cuenta Admin)
2. Crear subasta (nombre, descripción, importe mínimo, fechas)
3. Iniciar subasta (solo el creador)
4. Pujar (cualquier wallet conectada)
5. Cambiar a cuenta No-Admin en Phantom → pujar con importe mayor
6. Volver a cuenta Admin → finalizar subasta
7. Ver detalle: ganador y tabla de pujas

### Tests
```bash
cd ~/proyectos/solana-subastas
anchor test
```
Resultado esperado: **6/6 passing**.

---

## Repositorios

| Destino | URL |
|---|---|
| PR CodeCrypto Academy | *(pendiente — rama `add-solana-subastas`)* |
| GitHub personal | *(pendiente)* |
| GitLab portfolio | *(pendiente)* |

---

## Stack técnico

| Componente | Tecnología |
|---|---|
| Blockchain | Solana (localnet) |
| Smart contract | Anchor 0.31.1 + Rust |
| Frontend | Next.js 16.2, React 19, Tailwind v4 |
| Wallet | Phantom (wallet-adapter) |
| Tests | TypeScript + Mocha (anchor test) |
| Herramienta IA | Claude Code (VS Code) |
