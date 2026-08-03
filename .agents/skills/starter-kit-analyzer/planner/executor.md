# Executor

## Purpose
Execute the batched engine tasks asynchronously and collect artifacts.

## Inputs
Execution Plan from `planner/scheduler.md`.

## Execution
For each Batch:
1. Invoke specified Engines concurrently.
2. Collect returned Data Artifacts (Raw Objects).
3. Wait for all Batch tasks to finish.
4. Proceed to next Batch.

## Post-Execution
Pass all aggregated Artifacts to `validators/` then `commit/` then `renderers/`.
