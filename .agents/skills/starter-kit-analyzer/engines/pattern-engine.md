# Pattern Engine

## Objective
Extract the fundamental DNA and programming patterns from the codebase without applying generic best practices.

## Operation
1. Scan the repository source code.
2. Identify repeated syntax, architectural choices, and library usages.
3. Count occurrences to establish dominance.

## Rules
- **No LLM Opinions:** Do not judge whether a pattern is "good" or "bad."
- **Strict Counting:** Output exactly what is found.
- **Evidence-Based:** Attach file paths where the pattern was found.

## Output Format
```
Pattern: [Pattern Name]
Occurrences: [Number]
Evidence: [List of files]
Confidence: [0-100%]
```
