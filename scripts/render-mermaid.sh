#!/usr/bin/env bash
# render-mermaid.sh — render a Mermaid diagram to a dark-themed static SVG via Kroki.
#
# Usage:  scripts/render-mermaid.sh <input.mmd> <output.svg>
#
# Why: the blog (and the case study) embed architecture/concept diagrams as static
# SVGs in public/, so the site stays 100% static with no client-side JS and no
# external runtime dependency. We render once at authoring time and commit the SVG.
#
# The dark theme matches the site (bg #0a0b0c, accent emerald). Kroki rejects the
# %%{init}%% directive, so the theme is passed via the JSON API's diagram_options.
set -euo pipefail

in="${1:?usage: render-mermaid.sh <input.mmd> <output.svg>}"
out="${2:?usage: render-mermaid.sh <input.mmd> <output.svg>}"
mkdir -p "$(dirname "$out")"

req="$(mktemp)"
trap 'rm -f "$req"' EXIT
python3 - "$in" > "$req" <<'PY'
import json, sys
src = open(sys.argv[1], encoding="utf-8").read()
print(json.dumps({
    "diagram_source": src,
    "diagram_type": "mermaid",
    "output_format": "svg",
    "diagram_options": {"theme": "dark"},
}))
PY

code="$(curl -s -X POST https://kroki.io/ \
  -H 'Content-Type: application/json' \
  --data-binary @"$req" -o "$out" -w '%{http_code}' --max-time 60)"

if [ "$code" = "200" ] && head -c 5 "$out" | grep -q '<svg'; then
  echo "OK  $out  ($(wc -c < "$out") bytes)"
else
  echo "FAIL  http=$code  $(head -c 160 "$out")" >&2
  exit 1
fi
