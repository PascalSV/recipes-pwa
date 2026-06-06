---
# AGENTS.md

## Development
- Use `wrangler dev --remote` for local development (Cloudflare Workers)
- Run `vitest` for unit tests
- Run `playwright test` for end-to-end tests

## Tools
- Framework: Hono (Node.js)
- Testing: Vitest (unit), Playwright (E2E)
- Deployment: `wrangler deploy`

## Conventions
- TypeScript project
- Private package (no public registry)
- Uses `hono` and `@cloudflare/workers-types` for Cloudflare Worker implementation
