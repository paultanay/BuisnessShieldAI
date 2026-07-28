# BusinessShield

BusinessShield is an open-source compliance observability platform for web and SaaS teams. It helps teams track websites, run evidence-based checks, record findings, generate review-ready policy drafts, and organize compliance reporting.

This repository is in active hardening. It is not legal advice, and it does not claim full global compliance coverage. The current implementation focuses on building a truthful foundation: deterministic website evidence, clear remediation findings, typed API contracts, and a roadmap toward jurisdiction-aware rule packs.

## Current Capabilities

- Website portfolio tracking.
- Evidence-based scan checks for selected HTTP headers and HTML signals.
- Findings for security, privacy, accessibility, and SEO posture.
- Deterministic scan scoring.
- Reports and policy drafts for review.
- Clerk-based authentication.
- PostgreSQL persistence through Drizzle.
- OpenAPI-generated TypeScript clients and Zod schemas.
- API-key primitives for developer access.

## Current Limits

- BusinessShield does not replace legal counsel.
- Jurisdiction packs are planned, not complete.
- Monitoring settings exist, but a production scheduler/worker is still on the roadmap.
- Policy documents are structured drafts and require review before publication.
- AI features are not part of the current trusted product surface.

## Architecture

```text
apps/
  api/               Express API
  web/               React/Vite web app
packages/
  api-client-react/  Generated React Query client
  api-spec/          OpenAPI specification and Orval config
  api-zod/           Generated Zod schemas
  db/                Drizzle schema and database package
tools/
  design-lab/        Internal component preview workspace
scripts/             Workspace scripts
```

## Development

Install dependencies:

```bash
pnpm install
```

Run API tests:

```bash
pnpm --filter @business-shield/api test
```

Run typecheck:

```bash
pnpm run typecheck
```

Regenerate API clients:

```bash
pnpm --filter @business-shield/api-spec run codegen
```

## Environment

Copy `.env.example` and provide the required values for PostgreSQL, Clerk, and session secrets.

## Compliance Model

BusinessShield is moving toward a jurisdiction-pack model:

- Rules are versioned.
- Sources are cited.
- Automated checks produce evidence artifacts.
- Human review is required where automation cannot prove compliance.
- Coverage status will be labeled clearly as experimental, community-reviewed, maintainer-reviewed, or certified.

## License

MIT. See `LICENSE`.
