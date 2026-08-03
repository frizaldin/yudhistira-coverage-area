# Quality Engine

## Purpose
Assess code quality metrics such as coupling, cohesion, and maintainability against the repository's established standards.

## Inputs
Memory/architecture.json, newly generated code.

## Evaluation
- Is the new service strictly stateless?
- Does the UI component strictly avoid side effects?
- Are permissions properly hooked?

## Next
Emit EVENT `quality-check-completed`.
