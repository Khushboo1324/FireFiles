# Project Purpose

FireFiles is a full-stack meeting notes and transcript application inspired by the post-meeting workflow of Fireflies.ai. Keep implementation focused on assignment requirements; real speech-to-text and authentication are out of scope.

The stack is a Next.js TypeScript frontend, Python 3.12/FastAPI backend, SQLite with SQLAlchemy, Alembic migrations, pytest, ESLint, and the Next.js build. `frontend/` contains the web application, `backend/` contains the API, and `README.md` contains project documentation.

# Repository Boundaries

- Frontend-only tasks must not modify backend files unless explicitly required.
- Backend-only tasks must not modify frontend files unless explicitly required.
- Do not modify `.venv`, `node_modules`, `.next`, caches, or other generated directories.
- Do not modify unrelated files while completing a focused task.
- Do not delete existing code merely to simplify an implementation without explaining why.

# Before Making Changes

- Inspect the relevant existing files and understand the current architecture and conventions before editing.
- Explain the intended approach before significant architecture changes.
- Prefer extending existing patterns over creating duplicate systems.
- If requested behavior is ambiguous, state the assumption instead of silently inventing major behavior.

# Code Quality

- Keep functions and components focused and reasonably small.
- Prefer reusable components and services over duplicated code.
- Use clear, descriptive names and avoid unnecessary abstractions.
- Avoid dead code and commented-out implementations.
- Separate API routes, business logic, persistence, UI components, and utilities appropriately.
- Do not use TypeScript `any` without a strong documented reason.
- Use Python type hints for backend application code where practical.

# Comments and Explainability

This project will be discussed in a technical interview.

- Add concise comments for non-obvious logic and important architectural decisions.
- Explain why something is necessary rather than restating what the next line does.
- Especially explain complex transcript/player timestamp synchronization, transcript parsing, database relationships and cascade behavior, search/highlighting, and non-obvious state synchronization.
- Do not over-comment simple imports, assignments, JSX, or obvious CRUD operations.
- Keep code understandable without relying on comments for basic meaning.

# Dependencies

- Do not install a dependency unless it provides meaningful value.
- Before adding one, explain why the existing stack cannot reasonably handle the requirement.
- Never install Python packages globally; install them only inside `backend/.venv`.
- Update dependency manifests when dependencies change.
- Do not upgrade existing dependency versions without a task-specific reason.

# Backend Rules

- Use FastAPI for HTTP APIs, SQLAlchemy 2.x patterns for persistence, and Pydantic schemas for request and response validation.
- Keep API routes, schemas, models, database configuration, and business or service logic appropriately separated.
- Use SQLite for this assignment.
- Use Alembic once schema migrations are introduced.
- Once Alembic is established, do not create or modify the production database schema through ad-hoc startup code.
- Validate API inputs and return appropriate HTTP status codes.
- Do not expose internal exception details directly to API consumers.

# Frontend Rules

- Respect the more specific `frontend/AGENTS.md` instructions when modifying frontend files.
- Use TypeScript and prefer reusable UI components.
- Keep data-fetching logic separate from purely presentational UI when practical.
- Give interactive controls appropriate loading, error, disabled, and empty states when relevant.
- Avoid monolithic page components.
- Centralize backend configuration and API utilities instead of hard-coding backend URLs throughout components.
- Build the UI from project-owned components based on Fireflies-like visual references.

# Data and Security

- Never commit secrets, API keys, credentials, or real `.env` files.
- Use `.env.example` to document environment variables.
- Keep seeded meeting and transcript content fictional.
- Do not store sensitive real user information.
- Do not commit SQLite database files unless the user explicitly decides to later.

# Git and Scope

- Do not create commits or push changes unless explicitly asked.
- Do not rewrite existing Git history.
- Do not change branches unless explicitly requested.
- Before reporting completion, summarize which files changed.

# Validation

When backend Python code changes:

- Run relevant backend tests from `backend/`.
- At minimum, use `python -m pytest` unless a narrower test command is clearly sufficient.

When frontend application code changes:

- Run `npm run lint`.
- Run relevant type or build checks when the change could affect compilation.
- Run `npm run build` for substantial frontend changes before declaring completion.

If validation fails:

- Do not hide the failure; report what failed.
- Fix issues caused by the current task when possible.
- Do not suppress warnings or errors merely to make validation appear successful.

# Task Completion

When finishing an implementation task:

1. Briefly summarize what changed.
2. List important files created or modified.
3. Report validation commands and outcomes.
4. Mention remaining limitations or assumptions.
5. Explain important implementation decisions in plain language so the developer can understand and defend them in an interview.
