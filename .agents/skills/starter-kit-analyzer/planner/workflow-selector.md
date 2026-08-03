# Workflow Selector

Map the state and request to a specific workflow execution.

State: UNKNOWN
↓
`workflows/discover.md`

State: DISCOVERED
↓
`workflows/analyze.md`

State: ANALYZED
↓
`workflows/learn.md`

State: READY (Request: Feature Generation)
↓
`workflows/generate.md`

State: READY (Request: Code Review)
↓
`workflows/review.md`

State: UPDATED (Codebase Changed)
↓
`workflows/update.md`
