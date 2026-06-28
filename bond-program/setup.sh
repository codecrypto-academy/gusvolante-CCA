#!/usr/bin/env bash
# setup.sh — Bond Program: entorno completo para demo/test
# Uso: cd ~/proyectos/bond-program && bash setup.sh
# Prerequisitos: Solana CLI, Anchor CLI, Node.js, MongoDB instalado en WSL2

set -euo pipefail

PROJECT_DIR="$HOME/proyectos/bond-program"
cd "$PROJECT_DIR"

export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.avm/bin:$HOME/.cargo/bin:$PATH"

echo "============================================"
echo " Bond Program — Setup completo"
echo "============================================"

# ---- 1. MongoDB ----
echo ""
echo "[1/7] MongoDB..."
if pgrep -x mongod > /dev/null; then
  echo "  -> MongoDB ya corriendo (PID $(pgrep -x mongod))"
else
  echo "  -> Iniciando MongoDB..."
  sudo mkdir -p /data/db
  sudo mongod --dbpath /data/db --fork --logpath /var/log/mongod.log
  echo "  -> MongoDB iniciado"
fi
mongosh --quiet --eval 'db.runCommand({ ping: 1 })' | grep -q '"ok" : 1\|"ok":1\|ok: 1' && echo "  -> MongoDB ping OK" || echo "  !! MongoDB ping FALLÓ"

# ---- 2. Validador local ----
echo ""
echo "[2/7] Validador Solana local..."
if pgrep -f solana-test-validator > /dev/null; then
  VPID=$(pgrep -f solana-test-validator)
  echo "  -> Validador ya corriendo (PID $VPID). Matando para reset limpio..."
  kill "$VPID" && sleep 2
fi
echo "  -> Levantando validador con ledger limpio..."
rm -rf "$PROJECT_DIR/test-ledger"
nohup solana-test-validator -r --ledger "$PROJECT_DIR/test-ledger" > /tmp/validator-bond.log 2>&1 &
echo "  -> Esperando que el validador arranque..."
for i in $(seq 1 15); do
  solana cluster-version > /dev/null 2>&1 && break
  sleep 1
done
solana config set --url http://localhost:8899 > /dev/null 2>&1
echo "  -> Validador OK ($(solana cluster-version 2>/dev/null || echo 'verificando...'))"

# ---- 3. Keypair ----
echo ""
echo "[3/7] Keypair Solana..."
if [ ! -f "$HOME/.config/solana/id.json" ]; then
  echo "  -> Generando keypair..."
  solana-keygen new --no-bip39-passphrase -o "$HOME/.config/solana/id.json"
else
  echo "  -> Keypair existente: $(solana address)"
fi

# ---- 4. Airdrop SOL ----
echo ""
echo "[4/7] Airdrop SOL..."
ADMIN_WALLET=$(solana address)
echo "  -> Admin wallet: $ADMIN_WALLET"
solana airdrop 10 "$ADMIN_WALLET" > /dev/null 2>&1 || true
echo "  -> Balance: $(solana balance)"

# ---- 5. Build + Deploy programa ----
echo ""
echo "[5/7] Anchor build + deploy..."
cd "$PROJECT_DIR"
anchor build 2>&1 | tail -1
PROGRAM_ID=$(solana address -k target/deploy/bond_program-keypair.json)
echo "  -> Program ID: $PROGRAM_ID"

# Actualizar declare_id! y Anchor.toml si cambió
CURRENT_ID=$(grep -oP 'declare_id!\("\K[^"]+' programs/bond-program/src/lib.rs)
if [ "$CURRENT_ID" != "$PROGRAM_ID" ]; then
  echo "  -> Actualizando Program ID en lib.rs y Anchor.toml..."
  sed -i "s|declare_id!(\"$CURRENT_ID\")|declare_id!(\"$PROGRAM_ID\")|" programs/bond-program/src/lib.rs
  sed -i "s|bond_program = \"$CURRENT_ID\"|bond_program = \"$PROGRAM_ID\"|" Anchor.toml
  anchor build 2>&1 | tail -1
fi

anchor deploy 2>&1 | tail -2
echo "  -> Deploy OK"

# Copiar IDL actualizado al frontend
cp target/idl/bond_program.json web/src/idl/bond_program.json
echo "  -> IDL copiado a web/src/idl/"

# ---- 6. Crear tokens de prueba ----
echo ""
echo "[6/7] Creando tokens de prueba..."

# Stablecoin (decimals 0 para simplicidad)
STABLECOIN_MINT=$(spl-token create-token --decimals 0 2>&1 | grep "Creating token" | awk '{print $3}')
echo "  -> Stablecoin mint: $STABLECOIN_MINT"

# Bond token (decimals 0)
BOND_MINT=$(spl-token create-token --decimals 0 2>&1 | grep "Creating token" | awk '{print $3}')
echo "  -> Bond mint: $BOND_MINT"

# Crear ATAs y mintear
spl-token create-account "$STABLECOIN_MINT" > /dev/null 2>&1
spl-token create-account "$BOND_MINT" > /dev/null 2>&1
spl-token mint "$STABLECOIN_MINT" 1000000 > /dev/null 2>&1
spl-token mint "$BOND_MINT" 10000 > /dev/null 2>&1
echo "  -> Minteados: 1,000,000 stablecoins + 10,000 bonos al admin"

# ---- 7. Fondear wallet Phantom (si se configuró) ----
echo ""
PHANTOM_ADDRESS="${PHANTOM_WALLET:-8FW2HfoS7YqpFSkyt69QkRv1q2dXHnkDJSFPpBqTGiDy}"
echo "[7/9] Fondeando wallet Phantom ($PHANTOM_ADDRESS)..."
solana airdrop 5 "$PHANTOM_ADDRESS" > /dev/null 2>&1 || true
spl-token transfer "$STABLECOIN_MINT" 100000 "$PHANTOM_ADDRESS" --fund-recipient --allow-unfunded-recipient > /dev/null 2>&1
spl-token transfer "$BOND_MINT" 1000 "$PHANTOM_ADDRESS" --fund-recipient --allow-unfunded-recipient > /dev/null 2>&1
echo "  -> Phantom fondeada: 5 SOL + 100,000 stablecoins + 1,000 bonos"

# ---- 8. Registrar tokens en MongoDB ----
echo ""
echo "[8/9] Registrando tokens en MongoDB..."
mongosh --quiet "mongodb://localhost:27017/bond-program" --eval "
  db.tokens.deleteMany({});
  db.bonistas.deleteMany({});
  db.compras.deleteMany({});
  db.pagos_cupones.deleteMany({});

  db.tokens.insertOne({
    mintAddress: '$STABLECOIN_MINT',
    name: 'USD Coin',
    symbol: 'USDC',
    type: 'stablecoin',
    decimals: 0,
    supply: 1000000,
    creatorWallet: '$ADMIN_WALLET',
    createdAt: new Date()
  });

  db.tokens.insertOne({
    mintAddress: '$BOND_MINT',
    name: 'Bono CCA 2026',
    symbol: 'BCCA',
    type: 'bond',
    decimals: 0,
    supply: 10000,
    nominal: 100,
    tasaInteres: 5,
    years: 3,
    stablecoinMint: '$STABLECOIN_MINT',
    pricePerBond: 100,
    issuerWallet: '$ADMIN_WALLET',
    creatorWallet: '$ADMIN_WALLET',
    createdAt: new Date()
  });
  print('OK');
"
echo "  -> Stablecoin 'USD Coin (USDC)' + Bono 'Bono CCA 2026 (BCCA)' registrados"

# ---- 9. Crear listing on-chain ----
echo ""
echo "[9/10] Creando listing on-chain (5000 bonos a 100 stablecoins c/u)..."
cd "$PROJECT_DIR"
BOND_MINT="$BOND_MINT" STABLECOIN_MINT="$STABLECOIN_MINT" BOND_AMOUNT=5000 PRICE_PER_BOND=100 \
  anchor run create-listing 2>&1 | grep -E "Creating|Listing|Tx:|Error" || true
echo "  -> Listing creado (5000 BCCA en escrow, precio 100 USDC/bono)"

# ---- 10. Configurar .env.local del frontend ----
echo ""
echo "[10/11] Configurando .env.local del frontend..."
TREASURY_KEY=$(solana address -k ~/.config/solana/id.json --output json 2>/dev/null | grep -o '".*"' | tr -d '"' 2>/dev/null || true)
# Export private key as base58
TREASURY_PRIVATE_KEY=$(cat ~/.config/solana/id.json | python3 -c "
import json, sys
key_bytes = json.load(sys.stdin)
import base64
# Convert to base58
alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
num = int.from_bytes(bytes(key_bytes), 'big')
result = ''
while num > 0:
    num, remainder = divmod(num, 58)
    result = alphabet[remainder] + result
print(result)
" 2>/dev/null)
cat > "$PROJECT_DIR/web/.env.local" << EOF
NEXT_PUBLIC_CLUSTER_URL=http://localhost:8899
MONGODB_URI=mongodb://localhost:27017
TREASURY_WALLET_PRIVATE_KEY=$TREASURY_PRIVATE_KEY
EOF
echo "  -> .env.local actualizado con TREASURY_WALLET_PRIVATE_KEY"

# ---- 11. Resumen ----
echo ""
echo "============================================"
echo " SETUP COMPLETO"
echo "============================================"
echo ""
echo " Admin wallet:      $ADMIN_WALLET"
echo " Phantom wallet:    $PHANTOM_ADDRESS"
echo " Program ID:        $PROGRAM_ID"
echo " Stablecoin mint:   $STABLECOIN_MINT"
echo " Bond mint:         $BOND_MINT"
echo " MongoDB:           mongodb://localhost:27017/bond-program"
echo " Validador:         http://localhost:8899"
echo ""
echo " Tokens registrados en MongoDB (USDC + BCCA)"
echo " Listing on-chain activo (5000 BCCA @ 100 USDC)"
echo " Phantom fondeada (5 SOL + 100k USDC + 1k BCCA)"
echo ""
echo " Para el frontend:"
echo "   cd $PROJECT_DIR/web"
echo "   npm run dev -- --port 3000 --hostname 0.0.0.0"
echo ""
echo " Para cambiar la wallet Phantom:"
echo "   PHANTOM_WALLET=<address> bash setup.sh"
echo "============================================"
