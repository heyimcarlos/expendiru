#!/usr/bin/env bash
# Shallow-clone the upstream trees this app is patterned on.
# Safe to re-run: a directory that is already a git checkout is left alone.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
dest_root="$root/.reference"
mkdir -p "$dest_root"

clone_one() {
  local name="$1"
  local url="$2"
  local branch="${3:-}"
  local dest="$dest_root/$name"

  if [[ -d "$dest/.git" ]]; then
    echo "skip $name (already cloned)"
    return 0
  fi
  if [[ -e "$dest" ]]; then
    echo "skip $name ($dest exists and is not a git checkout)" >&2
    return 0
  fi

  if [[ -n "$branch" ]]; then
    git clone --depth 1 --branch "$branch" "$url" "$dest"
  else
    git clone --depth 1 "$url" "$dest"
  fi
}

# Effect 4, including @effect/platform-*. https://github.com/Effect-TS/effect
clone_one effect https://github.com/Effect-TS/effect.git

# Minimal CAFE chat app this repo follows. https://github.com/Effect-TS/cafe
clone_one cafe https://github.com/Effect-TS/cafe.git

# Foldkit source and examples. Pinned to the catalog version, same as cafe's
# foldkit skill, so the checkout matches the APIs this repo compiles against.
# https://github.com/foldkit/foldkit
foldkit_version="$(awk '$1 == "foldkit:" { print $2 }' "$root/pnpm-workspace.yaml")"
clone_one foldkit https://github.com/foldkit/foldkit.git "foldkit@${foldkit_version}"

# Alchemy resources and the alchemy.run docs site. https://github.com/alchemy-run/alchemy
clone_one alchemy https://github.com/alchemy-run/alchemy.git

# Add another checkout by calling clone_one. Not cloned unless you uncomment:
# clone_one effect-website https://github.com/Effect-TS/website.git
# clone_one opencode https://github.com/anomalyco/opencode.git
# executor.sh — paste the URL here when you have the repo.
# clone_one executor https://github.com/<owner>/<repo>.git
