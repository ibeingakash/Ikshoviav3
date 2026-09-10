#!/usr/bin/env bash
# ==============================================================================
# ensure-system-deps.sh
# Deterministic System Dependency Verification & Installer for OCR V2
# Installs and verifies native Ghostscript, Poppler, and Tesseract CLI with
# required English and Hindi language packs.
# ==============================================================================

set -euo pipefail

echo "=== [OCR V2] Verifying System Dependencies ==="

MISSING_DEPS=()

if ! command -v gs >/dev/null 2>&1; then
  MISSING_DEPS+=("ghostscript")
fi

if ! command -v pdftotext >/dev/null 2>&1; then
  MISSING_DEPS+=("poppler-utils")
fi

if ! command -v tesseract >/dev/null 2>&1; then
  MISSING_DEPS+=("tesseract-ocr")
fi

# Check languages if tesseract exists
LANGS_MISSING=0
if command -v tesseract >/dev/null 2>&1; then
  TESS_LANGS=$(tesseract --list-langs 2>&1 || true)
  if ! echo "$TESS_LANGS" | grep -q "eng"; then
    MISSING_DEPS+=("tesseract-ocr-eng")
    LANGS_MISSING=1
  fi
  if ! echo "$TESS_LANGS" | grep -q "hin"; then
    MISSING_DEPS+=("tesseract-ocr-hin")
    LANGS_MISSING=1
  fi
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
  echo "[OCR V2] Missing dependencies detected: ${MISSING_DEPS[*]}"
  if command -v apt-get >/dev/null 2>&1; then
    echo "[OCR V2] Attempting deterministic apt-get installation..."
    export DEBIAN_FRONTEND=noninteractive
    if [ "$(id -u)" -eq 0 ]; then
      apt-get update -qq
      apt-get install -y -qq \
        -o Dpkg::Options::="--force-confdef" \
        -o Dpkg::Options::="--force-confold" \
        --no-install-recommends \
        ghostscript \
        poppler-utils \
        tesseract-ocr \
        tesseract-ocr-eng \
        tesseract-ocr-hin
    elif command -v sudo >/dev/null 2>&1; then
      sudo apt-get update -qq
      sudo apt-get install -y -qq \
        -o Dpkg::Options::="--force-confdef" \
        -o Dpkg::Options::="--force-confold" \
        --no-install-recommends \
        ghostscript \
        poppler-utils \
        tesseract-ocr \
        tesseract-ocr-eng \
        tesseract-ocr-hin
    else
      echo "[OCR V2 ERROR] Missing root/sudo permissions to install packages: ${MISSING_DEPS[*]}" >&2
      exit 1
    fi
  else
    echo "[OCR V2 ERROR] apt-get not found. Please install: ${MISSING_DEPS[*]}" >&2
    exit 1
  fi
fi

# Final verification
echo "[OCR V2] Validating installed binaries..."
GS_VER=$(gs --version 2>&1)
echo "  ✓ Ghostscript: ${GS_VER}"

PDFTO_VER=$(pdftotext -v 2>&1 | head -n 1)
echo "  ✓ Poppler (pdftotext): ${PDFTO_VER}"

TESS_VER=$(tesseract --version 2>&1 | head -n 1)
echo "  ✓ Tesseract: ${TESS_VER}"

TESS_LANG_LIST=$(tesseract --list-langs 2>&1 | tr '\n' ' ')
echo "  ✓ Available OCR Languages: ${TESS_LANG_LIST}"

if ! echo "$TESS_LANG_LIST" | grep -q "eng" || ! echo "$TESS_LANG_LIST" | grep -q "hin"; then
  echo "[OCR V2 ERROR] Required language packs (eng, hin) missing from tessdata!" >&2
  exit 1
fi

echo "=== [OCR V2] System Dependencies Verified Successfully ==="
exit 0
