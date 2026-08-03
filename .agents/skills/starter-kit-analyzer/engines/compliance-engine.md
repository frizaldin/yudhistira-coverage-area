# Compliance Engine

## Objective
Compare the current repository implementation STRICTLY against the Starter Kit Memory.

## Operation
1. Load `starter-kit-analyzer` memory.
2. Examine current implementation.
3. Check for binary compliance (PASS, FAIL, or NOT FOUND).

## Rules
- **No External Best Practices:** If the starter kit uses inline validation, and the current code uses inline validation, it is a PASS. Do not recommend Form Requests.
- **Strictly Objective:** Do not inject personal LLM opinions.
- **Zero Hallucination:** Only check against explicitly recorded patterns in memory.

## Output Format
```
Category: [Name]
Status: [PASS / FAIL / NOT FOUND]
Expected Starter Kit Pattern: [Pattern]
Current Implementation: [Pattern]
Evidence: [Files]
```
