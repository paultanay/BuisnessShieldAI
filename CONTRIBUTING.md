# Contributing

Thank you for helping improve BusinessShield.

## Development Flow

1. Open an issue or discussion for substantial changes.
2. Keep pull requests focused.
3. Add or update tests for behavior changes.
4. Run verification before submitting:

```bash
pnpm --filter @business-shield/api test
pnpm run typecheck
```

## Compliance Rules

Rules and jurisdiction coverage must be source-backed. A contribution that adds or changes compliance guidance should include:

- Jurisdiction or framework.
- Source URL.
- Effective date, if known.
- Applicability criteria.
- Whether the check is automated or requires human review.
- Confidence level.

## Code Style

- Prefer existing patterns.
- Keep modules focused.
- Avoid broad refactors in feature PRs.
- Do not add AI-generated claims or marketing copy unless the behavior is implemented and verifiable.

## Legal Note

BusinessShield is not legal advice. Contributions should help users collect evidence and organize compliance work, not pretend to replace qualified legal review.
