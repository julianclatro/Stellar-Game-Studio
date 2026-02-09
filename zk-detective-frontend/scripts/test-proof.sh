#!/bin/bash
# F06: Full proof pipeline test
# Tests: nargo compile -> nargo execute -> bb prove -> bb verify
set -e

CIRCUIT_DIR="$(dirname "$0")/../../circuits/accusation"
BB="$(dirname "$0")/../node_modules/.bin/bb"

echo "=== ZK Accusation Circuit — Full Proof Pipeline Test ==="

echo ""
echo "1. Compiling circuit..."
cd "$CIRCUIT_DIR"
nargo compile
echo "   OK: Circuit compiled ($(ls -la target/accusation.json | awk '{print $5}') bytes)"

echo ""
echo "2. Running nargo tests..."
nargo test
echo "   OK: All circuit tests passed"

echo ""
echo "3. Executing circuit with Prover.toml..."
nargo execute
echo "   OK: Witness generated"

echo ""
echo "4. Generating verification key..."
"$BB" write_vk -b ./target/accusation.json -o ./target/vk
echo "   OK: VK generated ($(ls -la target/vk/vk | awk '{print $5}') bytes)"

echo ""
echo "5. Generating proof..."
"$BB" prove -b ./target/accusation.json -w ./target/accusation.gz -o ./target/proof -k ./target/vk/vk
echo "   OK: Proof generated ($(ls -la target/proof/proof | awk '{print $5}') bytes)"

echo ""
echo "6. Verifying proof..."
"$BB" verify -k ./target/vk/vk -p ./target/proof/proof -i ./target/proof/public_inputs
echo "   OK: Proof verified successfully"

echo ""
echo "=== All pipeline stages passed ==="
