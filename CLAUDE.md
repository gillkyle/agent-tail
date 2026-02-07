# CLAUDE.md

## Project Overview

Monorepo for browser log capture plugins. Pipes browser console output to log files on disk during development, enabling terminal-based log tailing alongside backend server logs.

## Packages

- **packages/core** (`agent-tail-core`) — Shared types, log formatting, filesystem management (sessions, symlinks, pruning), client script generation, gitignore checking
- **packages/vite-plugin** (`vite-plugin-agent-tail`) — Vite plugin that injects the client script and handles log ingestion via dev server middleware
- **packages/next-plugin** (`next-plugin-agent-tail`) — Next.js plugin with config wrapper, API route handler, and script component

## Tech Stack

- TypeScript (strict mode), ESM only
- tsdown for bundling each package
- vitest for testing (tests/ at repo root)
- pnpm workspaces

## Commands

```bash
pnpm install              # Install all dependencies
pnpm run build            # Build all packages
pnpm run test             # Run all tests once
pnpm run test:watch       # Run tests in watch mode
pnpm run typecheck        # Type-check all packages
```

## Code Style

- snake_case for functions, variables, and file names
- `node:` prefix for Node.js built-in imports
- `import type` for type-only imports
- 4-space indentation
- No trailing commas in function params; trailing commas in arrays/objects

## Key Concepts

- Each dev server session creates a timestamped directory under the configured `logDir`
- A `latest` symlink always points to the most recent session
- Old sessions are pruned to keep only the last N (configurable via `maxLogSessions`)
- Plugins warn if the log directory is not covered by `.gitignore`
- Client-side script is injected into HTML and batches logs via `sendBeacon`
- Multiple servers (frontend, backend, workers) can write to the same session directory

## Testing

- Tests live in `tests/` at the repo root, organized by package
- Filesystem tests create temp directories and clean up after themselves
- Mock server objects are used for plugin integration tests
