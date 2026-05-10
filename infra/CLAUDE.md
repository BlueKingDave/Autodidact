# Subtree Instructions — infra/

> These rules apply only within `infra/`. They extend the root `CLAUDE.md`.

## Purpose of this subtree

Terraform infrastructure as code for the Autodidact production environment on GCP. Manages: Cloud Run services (api, agent, worker), Artifact Registry for Docker images, and a Redis instance (Memorystore) used by BullMQ. State is stored in GCS.

---

## Invariants (must not be broken)

- Always run `terraform plan` before `terraform apply` — never apply without reviewing the plan output
- `environments/prod/` targets the live production environment — changes here affect production immediately on apply
- Never commit `.terraform/` directories or `terraform.tfstate` files — state is remote (GCS bucket `autodidact-terraform-state`)
- Reusable modules live in `infra/modules/` — do not duplicate infrastructure resource definitions in environment configs
- All secrets are sourced from GCP Secret Manager by name — never hardcode secret values in `.tf` files
- The `env_vars` map in each `cloud-run-service` module invocation contains Secret Manager secret names (not values) — the module resolves them via `secret_key_ref`

---

## Library / tooling rules

- Use:
  - Terraform >= 1.9.0
  - GCP provider (`hashicorp/google` ~> 5.0)
  - Remote state backend (GCS)
- Do not use:
  - Local state files (`terraform.tfstate`) — remote only
  - Inline resource definitions in `environments/` for things that belong in modules

---

## Source of truth

- Production service configurations: `infra/environments/prod/main.tf`
- Reusable modules: `infra/modules/`
- GCP project and default region: `infra/environments/prod/variables.tf` (default region: `us-central1`)
- Remote state backend: `infra/backend.tf` (bucket: `autodidact-terraform-state`)

---

## Key patterns to follow

- One Cloud Run service per backend service (api, agent, worker), each instantiated via `modules/cloud-run-service`
- `allow_public = true` only for the api service — agent and worker are internal only
- Environment variables for services are Secret Manager references — add new secrets to the `env_vars` map by secret name
- `min_instances = 1` on all services prevents cold starts in production — do not set to 0 unless intentionally accepting cold start latency

---

## Anti-patterns to avoid

- Do not hardcode secret values in `.tf` files — always reference Secret Manager secret names
- Do not add infra for non-production environments unless a new directory under `environments/` exists for it
- Do not expose agent or worker services publicly — `allow_public` must remain `false` for both

---

## Common workflows

```bash
cd infra/environments/prod
terraform init          # first time, or after provider/module changes
terraform plan          # always review before applying
terraform apply         # apply after reviewing plan output
```

---

## Key Decisions

- [ADR-012 — Cloud hosting platform](../docs/architecture/ADRs/infra/ADR-012-cloud-hosting-platform.md) (GCP Cloud Run)
- [ADR-021 — Infrastructure as code](../docs/architecture/ADRs/infra/ADR-021-infrastructure-as-code.md) (Terraform)
- [ADR-022 — CI/CD platform](../docs/architecture/ADRs/infra/ADR-022-cicd-platform.md) (GitHub Actions)
- [ADR-007 — Background job queue](../docs/architecture/ADRs/services/worker/ADR-007-background-job-queue.md) (Memorystore Redis — 🚩)
