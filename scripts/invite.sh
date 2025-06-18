#!/bin/bash

cd $(dirname "$0")
cd ../original

# codex --full-auto exec "Read the file ai-read-access/invitation_test.md and take action" -m o3-pro
mkdir -p ai-read-access/processed-appeals
mv ai-read-access/appeals/* ai-read-access/processed-appeals/
