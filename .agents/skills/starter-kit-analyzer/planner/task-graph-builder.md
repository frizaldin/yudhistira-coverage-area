# Task Graph Builder

## Purpose
Convert resolved Capabilities into a Directed Acyclic Graph (DAG) for execution.

## Inputs
Resolved Capabilities from `registry/capabilities.yaml` and `planner/capability-resolver.md`.

## Execution
1. Read dependencies (`requires` field) of each capability.
2. Build dependency tree.
3. Inherit capabilities (e.g., `Feature CRUD` inherits `CRUD`).

## Outputs
A compiled DAG structure representing all necessary engine invocations and their dependency constraints.

## Next
Pass DAG to `planner/scheduler.md`.
