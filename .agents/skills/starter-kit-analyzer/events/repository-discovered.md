# Event: Repository Discovered

## Triggered By
`engines/repository-engine.md`

## Payload
```json
{
  "state": "DISCOVERED",
  "metadata_path": "memory/manifest.json"
}
```

## Listeners
- `planner/workflow-resolver.md` (To trigger Architecture Analysis automatically)
