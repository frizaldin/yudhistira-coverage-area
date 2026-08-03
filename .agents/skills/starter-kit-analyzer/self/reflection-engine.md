# Reflection Engine

## Purpose
Evaluate generated code using a deterministic checklist.

## Inputs
Newly generated code, `memory/latest/architecture.json`, `memory/latest/conventions.json`.

## Checklist
- Architecture Match: [ ]
- Convention Match: [ ]
- Reuse Implemented: [ ]
- Dependency Contract Respected: [ ]
- Naming Standards Met: [ ]
- Folder Structure Correct: [ ]
- Security Audited: [ ]
- Performance Impact Negligible: [ ]

## Failure
If any item is [✗] (Failed), emit EVENT `GenerationNeedsRefinement`.

## Success
If all items are [✓], emit EVENT `GenerationCompleted`.
