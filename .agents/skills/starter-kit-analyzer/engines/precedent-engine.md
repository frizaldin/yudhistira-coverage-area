# Precedent Engine

## Objective
Ensure all recommendations and generated code are grounded in existing codebase precedents rather than generic LLM knowledge.

## Operation
1. Intercept any recommendation or code generation request.
2. Search the existing codebase (Memory & Source) for a similar implementation.
3. If a precedent exists, force the recommendation to follow it.
4. If no precedent exists, flag the recommendation as "Low Confidence" or "General Recommendation".

## Rules
- **Precedent First:** The repository is the sole source of truth.
- **No Precedent = No Strong Recommendation:** If the starter kit does not use a specific library/pattern (e.g., Redux, FormRequests, DTOs), do not suggest it unless explicitly requested.

## Output Format
```
Recommendation: [Action]
Precedent Found: [Yes / No]
Evidence: [File path showing existing pattern]
Confidence: [High (if precedent) / Low (if generic)]
```
