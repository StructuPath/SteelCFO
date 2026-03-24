#!/usr/bin/env bash
set -euo pipefail

echo "🏗️  SteelCFO Setup"
echo "=================="
echo ""

# Check dependencies
MISSING=()

if ! command -v pi &> /dev/null; then
    MISSING+=("pi (https://github.com/anthropics/pi)")
fi

if ! command -v just &> /dev/null; then
    MISSING+=("just (brew install just)")
fi

if ! command -v node &> /dev/null; then
    MISSING+=("node (https://nodejs.org)")
fi

if [ ${#MISSING[@]} -gt 0 ]; then
    echo "❌ Missing dependencies:"
    for dep in "${MISSING[@]}"; do
        echo "   - $dep"
    done
    echo ""
    echo "Install the above and re-run this script."
    exit 1
fi

echo "✅ Dependencies OK"
echo "   pi:   $(which pi)"
echo "   just: $(which just)"
echo "   node: $(which node)"
echo ""

# Verify project structure
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

REQUIRED_DIRS=(".pi/agents" ".pi/themes" ".pi/prompts" ".pi/skills" "extensions" "data/sample")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "❌ Missing directory: $dir"
        exit 1
    fi
done

echo "✅ Project structure OK"

# Check for sample data
SAMPLE_FILES=(jobs.csv costs.csv ar.csv ap.csv payroll.csv change_orders.csv bank.csv)
SAMPLE_COUNT=0
for f in "${SAMPLE_FILES[@]}"; do
    if [ -f "data/sample/$f" ]; then
        SAMPLE_COUNT=$((SAMPLE_COUNT + 1))
    fi
done
echo "✅ Sample data: $SAMPLE_COUNT/${#SAMPLE_FILES[@]} files found"

# Check extensions
EXT_COUNT=0
for f in extensions/*.ts; do
    if [ -f "$f" ]; then
        EXT_COUNT=$((EXT_COUNT + 1))
    fi
done
echo "✅ Extensions: $EXT_COUNT TypeScript files"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 SteelCFO is ready!"
echo ""
echo "  Get started:"
echo "    cd $(pwd)"
echo "    just load-sample    # Load sample data"
echo "    just cfo            # Start the CFO"
echo ""
echo "  Other commands:"
echo "    just weekly-brief   # Weekly executive brief"
echo "    just cash-check     # Cash position"
echo "    just risk-scan      # Risk assessment"
echo "    just --list         # All commands"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
