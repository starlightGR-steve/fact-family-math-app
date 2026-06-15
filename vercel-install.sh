#!/usr/bin/env bash
set -e
git config --global url."https://${GITHUB_PAT}@github.com/".insteadOf "https://github.com/"
git submodule sync --recursive
git submodule update --init --recursive
npm install
