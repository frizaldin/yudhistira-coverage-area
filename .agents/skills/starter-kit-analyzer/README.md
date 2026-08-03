# Starter Kit Analyzer

Starter Kit Analyzer is an AI engineering skill designed to reverse engineer software starter kits into reusable engineering knowledge.

Unlike documentation generators, this skill focuses on extracting engineering patterns directly from source code.

It learns how the project is built before generating any new code.

---

# Goals

✔ Discover project architecture

✔ Build dependency graphs

✔ Extract coding conventions

✔ Learn reusable patterns

✔ Identify extension points

✔ Build engineering knowledge base

✔ Review new code

✔ Generate code consistent with existing implementation

---

# Philosophy

Source Code

↓

Facts

↓

Relationships

↓

Knowledge

↓

Generation

The repository itself is the source of truth.

---

# Workflow

discover

↓

analyze

↓

learn

↓

generate

review

↓

update

---

# Repository Lifecycle

First Run

Repository

↓

Discover

↓

Analyze

↓

Learn

↓

Memory

Subsequent Runs

Memory

↓

Generate

Repository Changes

Changed Files

↓

Update

↓

Refresh Memory

---

# Directory Structure

starter-kit-analyzer/

SKILL.md

README.md

config.yaml

workflows/

prompts/

templates/

memory/

output/

---

# Memory

Memory stores structured knowledge.

Examples

Architecture

Components

Routes

Services

Modules

Conventions

Knowledge Graph

The memory becomes the permanent context for future code generation.

---

# Output

The analyzer produces human-readable reports.

Architecture

Knowledge Graph

Review

AI Context

Unlike memory,

output can always be regenerated.

---

# Principles

Never assume.

Never hallucinate.

Never replace existing architecture.

Prefer reuse.

Prefer evidence.

Prefer consistency.

Prefer maintainability.

---

# Supported Frameworks

Laravel

Symfony

React

Vue

Next.js

Nuxt

Express

NestJS

Spring Boot

ASP.NET

Django

Flask

Rails

FastAPI

and any repository with readable source code.

---

# Version

1.0.0