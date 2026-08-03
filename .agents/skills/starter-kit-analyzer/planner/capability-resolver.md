# Capability Resolver

## Goal
Map repository state and User Request to a specific Need/Capability.

## Execution
Read `registry/workflows.yaml`.

If State == UNKNOWN:
Need = Repository Discovery

If State == DISCOVERED:
Need = Repository Analysis

If State == READY AND User Request == "Review Code":
Need = Architecture Validation

Return resolved Need to Workflow Resolver.
