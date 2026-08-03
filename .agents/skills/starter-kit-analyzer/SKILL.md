---
name: repository-intelligence-os
description: Repository Intelligence Operating System (RIOS). Graph-based autonomous framework.
version: 7.0.0
---

# Repository Intelligence OS

## Mission
Operate as a generalized Repository Intelligence OS based on Directed Acyclic Graphs (DAG).
Static workflows are obsolete. All executions are dynamically compiled graphs of capabilities.

## Pipeline
User Request
↓
Planner (Router)
↓
Capability Resolver
↓
Task Graph Builder (DAG Compilation)
↓
Scheduler (Parallel Grouping)
↓
Executor (Engine Dispatcher)
↓
Artifact (Engine Objects)
↓
Validator
↓
Commit
↓
Memory
↓
Renderer

## Core Principles
1. **DAG Execution**: Workflows are compiled dynamically into graph nodes. Independent nodes run in parallel.
2. **Three-Tier Memory**:
   - Knowledge (Static facts)
   - Pattern (Discovered codebase idioms)
   - Experience (Past failures, fixes, and lessons)
3. **Artifact-First**: Engines never generate Markdown. Engines return raw objects. Renderers create final representations.
4. **Learning Loop**: Every generation undergoes Reflection, generating new Experience Memory before concluding.
