# Diff Engine

## Purpose
Determine exactly which files changed since the last memory commit.

## Inputs
`git diff` or filesystem stat timestamps vs `memory/latest/manifest.json` timestamp.

## Outputs
Array of changed files.
Affected capabilities (e.g. if Route changed, trigger route-engine only).

## Next
Emit EVENT `TargetedUpdateRequested` with payload of affected files.
