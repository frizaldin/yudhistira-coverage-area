# Scheduler

## Purpose
Analyze the Task Graph (DAG) and group nodes into execution batches.

## Inputs
Task Graph from `planner/task-graph-builder.md`.

## Execution
1. Identify all nodes with no unresolved dependencies (Leaf nodes).
2. Group them into Execution Batch 1.
3. Remove resolved nodes from graph.
4. Repeat to create Batch 2, 3... until graph is empty.

## Outputs
Ordered execution plan grouping parallelizable tasks.

## Next
Pass Execution Plan to `planner/executor.md`.
