# ADR-005: BullMQ for Background Jobs

## Status: Accepted

## Context
Need a job queue for background processing (emails, notifications, cleanup). Options: BullMQ, Agenda, custom with Redis, RabbitMQ.

## Decision
Use **BullMQ** with Redis.

## Rationale
- Battle-tested, widely adopted in Node.js ecosystem
- Supports delayed, repeated, and priority jobs
- Built-in retry with exponential backoff
- Redis already required for caching
- Dashboard available (Bull Board) for monitoring

## Consequences
- Redis dependency (already needed)
- Worker process must be deployed separately
- Jobs are lost if Redis data is wiped (mitigated by persistence)
