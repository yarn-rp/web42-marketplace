#!/usr/bin/env bash
#
# Web42 CLI installer
# Usage: curl -fsSL https://raw.githubusercontent.com/yarn-rp/web42-marketplace/main/packages/cli/install.sh | bash
#
set -euo pipefail

REPO="yarn-rp/web42-marketplace"
BINARY_NAME="web42"
INSTALL_DIR="/usr/local/bin"
FALLBACK_DIR="$HOME/.local/bin"

info()  { printf '\033[1;34m%s\033[0m\n' "$*"; }
error() { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

detect_platform() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os" in
    Linux*)  os="linux" ;;
    Darwin*) os="darwin" ;;
    MINGW*|MSYS*|CYGWIN*) error "Windows detected. Please use Scoop or download the binary directly from GitHub Releases." ;;
    *) error "Unsupported operating system: $os" ;;
  esac

  case "$arch" in
    x86_64|amd64) arch="x64" ;;
    arm64|aarch64) arch="arm64" ;;
    *) error "Unsupported architecture: $arch" ;;
  esac

  echo "${os}-${arch}"
}

get_latest_version() {
  local url="https://api.github.com/repos/${REPO}/releases?per_page=20"
  local auth_header=()
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    auth_header=(-H "Authorization: token ${GITHUB_TOKEN}")
  fi
  local response
  response="$(curl -fsSL "${auth_header[@]}" "$url")" || error "Failed to fetch releases from GitHub API."

  local tag
  tag="$(echo "$response" | grep -o '"tag_name":\s*"cli/v[^"]*"' | head -1 | sed 's/.*"cli\/v\([^"]*\)".*/\1/')"

  if [ -z "$tag" ]; then
    error "No cli release found. Make sure there is a release tagged cli/v*."
  fi

  echo "$tag"
}

download_binary() {
  local version="$1" platform="$2"
  local asset_name="${BINARY_NAME}-${platform}"

  info "Downloading ${BINARY_NAME} v${version} for ${platform}..."
  local tmpdir
  tmpdir="$(mktemp -d)"
  trap 'rm -rf "$tmpdir"' EXIT

  if [ -n "${GITHUB_TOKEN:-}" ]; then
    local asset_url
    asset_url="$(curl -fsSL \
      -H "Authorization: token ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github.v3+json" \
      "https://api.github.com/repos/${REPO}/releases/tags/cli/v${version}" \
      | grep -o "\"browser_download_url\":\s*\"[^\"]*${asset_name}\"" \
      | head -1 \
      | sed 's/.*"\(https[^"]*\)".*/\1/')"

    local asset_id
    asset_id="$(curl -fsSL \
      -H "Authorization: token ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github.v3+json" \
      "https://api.github.com/repos/${REPO}/releases/tags/cli/v${version}" \
      | grep -B5 "\"name\":\s*\"${asset_name}\"" \
      | grep -o '"id":\s*[0-9]*' | head -1 | grep -o '[0-9]*')"

    curl -fsSL \
      -H "Authorization: token ${GITHUB_TOKEN}" \
      -H "Accept: application/octet-stream" \
      -o "${tmpdir}/${BINARY_NAME}" \
      "https://api.github.com/repos/${REPO}/releases/assets/${asset_id}" \
      || error "Download failed for ${asset_name}."
  else
    local download_url="https://github.com/${REPO}/releases/download/cli/v${version}/${asset_name}"
    curl -fsSL -o "${tmpdir}/${BINARY_NAME}" "$download_url" \
      || error "Download failed. Check that the release asset exists: ${download_url}"
  fi

  chmod +x "${tmpdir}/${BINARY_NAME}"
  echo "${tmpdir}/${BINARY_NAME}"
}

install_binary() {
  local src="$1"
  local target_dir="$INSTALL_DIR"

  if [ -w "$target_dir" ]; then
    mv "$src" "${target_dir}/${BINARY_NAME}"
  elif command -v sudo >/dev/null 2>&1; then
    info "Installing to ${target_dir} (requires sudo)..."
    sudo mv "$src" "${target_dir}/${BINARY_NAME}"
  else
    target_dir="$FALLBACK_DIR"
    mkdir -p "$target_dir"
    mv "$src" "${target_dir}/${BINARY_NAME}"
    if ! echo "$PATH" | tr ':' '\n' | grep -qx "$target_dir"; then
      info ""
      info "Add ${target_dir} to your PATH:"
      info "  echo 'export PATH=\"${target_dir}:\$PATH\"' >> ~/.bashrc && source ~/.bashrc"
    fi
  fi

  info "Installed ${BINARY_NAME} to ${target_dir}/${BINARY_NAME}"
}

main() {
  info "Web42 CLI Installer"
  info ""

  local platform version binary_path
  platform="$(detect_platform)"
  version="$(get_latest_version)"
  binary_path="$(download_binary "$version" "$platform")"
  install_binary "$binary_path"

  info ""
  if command -v "$BINARY_NAME" >/dev/null 2>&1; then
    info "Installed successfully! ($("$BINARY_NAME" --version))"
  else
    info "Installed successfully! (v${version})"
  fi
  info ""
  info "Get started:"
  info "  ${BINARY_NAME} auth login    # authenticate with GitHub"
  info "  ${BINARY_NAME} search <q>    # find agents"
  info "  ${BINARY_NAME} --help        # see all commands"
}

main
