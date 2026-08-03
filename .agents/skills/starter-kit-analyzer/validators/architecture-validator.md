# Architecture Validator

## Purpose
Validate Architecture Engine output against the schema data contract.

## Inputs
`artifacts/architecture.schema.json`, Output from Architecture Engine.

## Execution
Check if the generated artifact strictly conforms to the JSON Schema.
- Does it have `system`?
- Are `layers` an array of strings?
- Are `evidence` paths pointing to real files?

## Failure
If validation fails, emit EVENT `ArtifactValidationFailed`.

## Success
Pass valid artifact to `commit-engine`.
