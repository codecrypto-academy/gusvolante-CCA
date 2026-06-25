#!/usr/bin/env bash
# Setup completo del entorno de demo para Solana Subastas
# Uso: bash setup.sh
# Requiere: Rust, Solana CLI, Anchor CLI (avm), Node + npm ya instalados

set -euo pipefail

export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.avm/bin:$HOME/.cargo/bin:$PATH"
cd "$(dirname "$0")"

# Wallets de Phantom (localnet)
ADMIN_WALLET="8FW2HfoS7YqpFSkyt69QkRv1q2dXHnkDJSFPpBqTGiDy"
NOADMIN_WALLET="69TJVifqAJzWxRFuDkphe34pHJypvmaYdf2542TDYaYX"

echo "==> Configurando cluster a localnet"
solana config set --url http://127.0.0.1:8899 > /dev/null

if [ ! -f "$HOME/.config/solana/id.json" ]; then
  echo "==> Generando wallet del CLI (~/.config/solana/id.json)"
  solana-keygen new --no-bip39-passphrase
fi

echo "==> Deteniendo validador anterior (si existe)"
pkill -f solana-test-validator 2>/dev/null || true
sleep 2

echo "==> Levantando solana-test-validator (ledger limpio, en background)"
rm -rf test-ledger
nohup solana-test-validator --quiet > /tmp/validator-subastas.log 2>&1 &
disown
sleep 5

echo "==> Airdrop de SOL a la wallet del CLI"
solana airdrop 10

echo "==> Compilando y desplegando el programa Anchor"
anchor build
anchor deploy

echo "==> Copiando IDL al frontend (web/app/idl/)"
mkdir -p web/app/idl
cp target/idl/solana_subastas.json web/app/idl/solana_subastas.json
cp target/types/solana_subastas.ts web/app/idl/solana_subastas.ts

echo "==> Fondeando wallets de Phantom"
solana airdrop 10 "$ADMIN_WALLET"
solana airdrop 5 "$NOADMIN_WALLET"

echo ""
echo "==================================================================="
echo "Listo. Entorno de demo preparado."
echo ""
echo "  Program ID: $(anchor keys list | awk '{print $2}')"
echo "  Admin:      $ADMIN_WALLET (10 SOL)"
echo "  No-Admin:   $NOADMIN_WALLET (5 SOL)"
echo ""
echo "Próximos pasos:"
echo "1. cd web && npm install && npx next dev --port 3001 --hostname 0.0.0.0"
echo "2. Configurar Phantom en 'Solana Localnet' (Developer Settings -> Testnet Mode)"
echo "3. Abrir http://localhost:3001 (o http://<WSL_IP>:3001 desde Windows)"
echo "4. Conectar Phantom, crear subasta, iniciar, pujar, finalizar"
echo "==================================================================="
