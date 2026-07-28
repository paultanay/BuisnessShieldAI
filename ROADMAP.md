# Roadmap

This roadmap is intentionally honest. Items are not considered shipped until implemented, tested, and documented.

## P0: Credibility And Safety

- Remove generated/Replit residue from tracked source.
- Keep UI claims aligned with implemented behavior.
- Add tests and CI.
- Regenerate API clients from the OpenAPI source.
- Document legal and product limits clearly.

## P1: Evidence-Based Scanner

- Expand HTTP/header checks.
- Add cookie and tracker inventory.
- Add browser-based scanning with Playwright.
- Add axe-core or Pa11y accessibility evidence.
- Store scanner version, rule version, timestamp, and evidence artifacts.
- Make scoring deterministic and explainable.

## P2: Jurisdiction Packs

- EU/UK pack: GDPR, ePrivacy, WCAG/EAA readiness, NIS2 and DORA applicability, AI Act readiness.
- US/California pack: CCPA/CPRA, accessibility, HIPAA and PCI applicability.
- India DPDP pack.
- Brazil LGPD pack.
- Singapore PDPA pack.
- Rule-pack contribution and review process.

## P3: Workflow And Monitoring

- Background worker and scheduler.
- Periodic scans.
- Alert delivery via email and webhooks.
- Remediation tasks with owner, due date, status, and risk acceptance.
- Auditor exports.
- Trust center.

## P4: Enterprise Readiness

- Organization-first data model.
- RBAC.
- Scoped API keys.
- Rate limits.
- SSO.
- Data export and deletion workflows.
- Tenant isolation tests.
- Backup and restore documentation.

## P5: Open-Core Business Model

- Free open-source scanner and rule engine.
- Managed cloud hosting.
- Certified rule packs.
- Enterprise evidence retention.
- Support and SLA.
- Auditor and legal partner marketplace.
