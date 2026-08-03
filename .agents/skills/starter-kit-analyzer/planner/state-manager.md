# State Manager

## Goal
Evaluate repository state strictly from memory and cache.

## Execution
Check `cache/repository.cache.json` and `memory/manifest.json`.

Return EXACT state to Router:
- UNKNOWN
- DISCOVERED
- ANALYZED
- LEARNED
- READY
- UPDATED
