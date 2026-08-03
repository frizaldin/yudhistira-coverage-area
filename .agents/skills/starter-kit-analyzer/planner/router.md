# Router

## Goal
Route the execution by determining state and resolving capabilities.

## Execution
Phase 1
Invoke `planner/state-manager.md`

↓
Phase 2
Pass state to `planner/capability-resolver.md`

↓
Phase 3
Pass capability to `planner/workflow-resolver.md`

↓
Phase 4
Execute resolved workflow.

Never execute workflows directly here.
