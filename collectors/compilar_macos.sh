#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"

python3 -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

python -m PyInstaller \
  --clean \
  --noconfirm \
  --windowed \
  --onedir \
  --name ColetorGR-macOS \
  coletor_multimodelo_api.py

echo "Aplicativo criado em: $SCRIPT_DIR/dist/ColetorGR-macOS.app"
