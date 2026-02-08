# Infrastructure as Code (IaC)

This project should be provisioned using IaC to ensure repeatable environments.

## Recommended Stack (Render)

- Render Blueprint (`render.yaml`) for infrastructure
- Separate services for staging and production
  - Use two Render services per app, or two Render environments if available

## Targets to Provision on Render

- PostgreSQL databases for each service
- Managed web services for each Node service and the web app
- Environment variables (Render dashboard or Blueprint)

## Environment Layout (Suggested)

- Render requires a single `render.yaml` at the repo root.
- To keep staging and production separate, use two branches, each with its own `render.yaml`.
- Staging services prefixed with `stg-`
- Production services prefixed with `prod-`

## Using Separate Files

- This repo includes `render.staging.yaml` and `render.production.yaml`.
- To apply one environment, copy the desired file to `render.yaml` in the branch you connect to Render.
- Do not manage the same service with more than one Blueprint.

## Next Actions

- Add a `render.yaml` Blueprint to this repo
- Define services and databases
- Map environment variables per service
