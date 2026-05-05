# Infrastructure

## Purpose

Terraform infrastructure as code for the Autodidact production environment on GCP.

This folder is responsible for:
- Provisioning GCP Cloud Run services (api, agent, worker)
- Artifact Registry (`autodidact` repository) for Docker images
- Redis (Memorystore, STANDARD_HA tier, Redis 7.0) for BullMQ queue state

This folder is not responsible for:
- Application code deployment (handled by CI/CD — images are built and pushed separately)
- Database schema (managed in `packages/db/migrations/`)
- Supabase configuration (managed via Supabase dashboard — see ADR-002)

---

## Where this fits

- Parent: root `README.md`
- Infrastructure decisions: `docs/architecture/ADRs/ADR-012-gcp-cloud-run-terraform.md`

---

## Structure

```
infra/
├── backend.tf                    # Remote state (GCS bucket: autodidact-terraform-state)
├── providers.tf                  # GCP provider declaration
├── environments/
│   └── prod/
│       ├── main.tf               # All service module invocations for production
│       └── variables.tf          # project_id, region, service_account_name
└── modules/
    ├── cloud-run-service/        # Reusable Cloud Run v2 service + IAM
    ├── artifact-registry/        # Docker image registry (DOCKER format)
    └── redis/                    # Memorystore Redis instance
```

---

## Service configurations (prod)

| Service | Public | CPU | Memory | Min | Max |
|---------|--------|-----|--------|-----|-----|
| autodidact-api | yes | 1 | 512Mi | 1 | 10 |
| autodidact-agent | no | 2 | 2Gi | 1 | 5 |
| autodidact-worker | no | 1 | 512Mi | 1 | 3 |

All services source their environment variables exclusively from GCP Secret Manager by secret name — no values are stored in Terraform state.

---

## Common workflows

```bash
cd infra/environments/prod
terraform init          # initialize providers and remote state
terraform plan          # preview changes
terraform apply         # apply after reviewing plan
```

---

## Key variables

| Variable | Description | Default |
|----------|-------------|---------|
| `project_id` | GCP project ID | (required) |
| `region` | GCP region for all resources | `us-central1` |
| `service_account_name` | Cloud Run service account name prefix | `autodidact-run` |

---

## Gotchas

- Always run `terraform plan` first — `environments/prod/` is the live environment
- State is stored in GCS (`autodidact-terraform-state`) — never commit local `.tfstate` files
- All environment variables in service definitions are Secret Manager secret names, not values — the `cloud-run-service` module resolves them via `secret_key_ref` at runtime
- `min_instances = 1` on all services keeps them warm; setting to 0 will introduce cold start latency on first request
