# Commit Engine

## Purpose
Commit validated artifacts to immutable memory history.

## Inputs
Validated Artifacts, `memory/latest/`.

## Execution
1. Create timestamped folder in `memory/history/YYYY-MM-DD-HHMMSS/`.
2. Move current `latest/` files into this history folder.
3. Write new artifacts to `memory/latest/`.
4. Update `memory/vector/` embeddings text.

## Outputs
Emit EVENT `KnowledgeCommitted`.
