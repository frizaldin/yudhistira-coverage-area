# Event: Generation Needs Refinement

## Triggered By
`self/reflection-engine.md`

## Payload
```json
{
  "failed_checks": ["Reuse Implemented", "Dependency Contract Respected"],
  "evidence": "Found raw HTML table instead of Components/UI/Table"
}
```

## Listeners
- `engines/generation-engine.md` (Triggers re-generation to fix failures)
