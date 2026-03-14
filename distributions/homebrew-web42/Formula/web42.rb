# typed: false
# frozen_string_literal: true

# This formula is auto-updated by GitHub Actions on each CLI release.
# Repository: https://github.com/yarn-rp/homebrew-web42
#
# Install: brew install yarn-rp/web42/web42
class Web42 < Formula
  desc "CLI for the Web42 Agent Marketplace"
  homepage "https://web42.ai"
  version "0.1.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/yarn-rp/web42-marketplace/releases/download/cli/v0.1.0/web42-darwin-arm64"
      sha256 "PLACEHOLDER"
    else
      url "https://github.com/yarn-rp/web42-marketplace/releases/download/cli/v0.1.0/web42-darwin-x64"
      sha256 "PLACEHOLDER"
    end
  end

  on_linux do
    url "https://github.com/yarn-rp/web42-marketplace/releases/download/cli/v0.1.0/web42-linux-x64"
    sha256 "PLACEHOLDER"
  end

  def install
    binary_name = stable.url.split("/").last
    bin.install binary_name => "web42"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/web42 --version").strip
  end
end
