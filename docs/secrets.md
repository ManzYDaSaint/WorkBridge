# Secrets Management (Dev vs Prod)

This project uses `.env` files for local development only.
Production secrets must be injected at runtime using a secrets manager.

## Local Development (Docker Compose)

- Copy `env.example` to `.env` in each service folder
- Keep local secrets in `.env` and **never** commit them

## Production (Recommended Pattern)

Use a secrets manager to inject variables at deploy time:

- AWS Secrets Manager
- HashiCorp Vault
- GCP Secret Manager
- Azure Key Vault

## Minimum Required Secrets

- `JWT_SECRET`
- `DATABASE_URL` per service
- Any third-party keys (e.g., Supabase)

## Rotation

- Rotate `JWT_SECRET` during scheduled maintenance
- Rotate database passwords on a cadence (monthly/quarterly)
- Rotate third-party keys on provider schedules

## Audit

- Maintain an access log for secrets
- Limit who can read secrets to production deploy roles only
