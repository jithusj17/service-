# ADR-001: Monorepo with pnpm Workspaces

## Status: Accepted

## Context
We need to manage three applications (API, Web, Worker) and shared code. Options considered:
- Separate repositories
- Nx monorepo
- Turborepo
- pnpm workspaces

## Decision
Use **pnpm workspaces** without additional monorepo tooling.

## Rationale
- Native workspace support, no extra dependencies
- Fast package management with content-addressable storage
- Simple configuration via `pnpm-workspace.yaml`
- Can add Turborepo later for build caching if needed

## Consequences
- Manual script orchestration (acceptable for current scale)
- No built-in task caching (Turborepo can be added later)
