# Repository Engine

## Purpose
Inspect the repository framework, languages, package managers, and modules.

## Inputs
Repository root directory path.

## Outputs
Repository metadata, Detected framework, Detected languages, Folder structure, Entry points.

## Evidence
Every conclusion must reference existing source files (e.g. package.json, composer.json).

## Constraints
Never infer. Never assume.

## Failure Mode
If metadata cannot be verified, return NOT FOUND.

## Next Engine
Memory Writer (to save manifest) OR Architecture Engine (if continuing analysis).
