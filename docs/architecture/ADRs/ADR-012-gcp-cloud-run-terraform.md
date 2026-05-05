# ADR-012: GCP Cloud Run + Terraform for Production Infrastructure

## Status

Accepted — 2026-05-05

## Context

The system requires hosting for three backend services (API, Agent, Worker), a Redis instance (for BullMQ queue state — see ADR-007), and a container image registry. All three services are independently deployable containers running different runtimes (NestJS, Fastify, BullMQ worker).

Infrastructure choices affect: cold start latency, scaling behavior, operational complexity, and cost at low traffic volumes during the early product phase. At this stage, traffic is sparse and unpredictable, so pay-per-request economics matter more than throughput ceiling.

The team had existing GCP familiarity. The database is Supabase-managed and cloud-provider-agnostic (see ADR-002), so there is no vendor lock-in pressure from the database layer.

## Decision

We deploy to Google Cloud Platform using Cloud Run v2 for all three backend services, with Terraform (>= 1.9.0, `hashicorp/google` ~> 5.0) managing infrastructure as code. Container images are stored in a GCP Artifact Registry repository (`autodidact`, DOCKER format) in `us-central1`. Terraform state is stored in GCS (`autodidact-terraform-state`).

Service configuration in production:

- **autodidact-api**: 1 CPU / 512Mi, min 1 / max 10 instances, public (allUsers invoker)
- **autodidact-agent**: 2 CPU / 2Gi, min 1 / max 5 instances, internal only
- **autodidact-worker**: 1 CPU / 512Mi, min 1 / max 3 instances, internal only

All environment variables are sourced from GCP Secret Manager by secret name — no secrets are stored in Terraform state. Infrastructure is organized as reusable modules under `infra/modules/` (cloud-run-service, artifact-registry, redis), invoked from `infra/environments/prod/`.

## Consequences

### Positive

- Cloud Run `min_instances = 1` keeps services warm with no idle compute cost penalty compared to always-on VMs, while `max_instances` caps spend at traffic spikes
- Per-request billing matches early-stage sparse traffic patterns
- Managed TLS, load balancing, and rolling deployments are provided out of the box by Cloud Run — no ingress or certificate configuration required
- Terraform codifies all infrastructure; changes are reviewable via PR and reproducible from scratch
- Secret Manager integration means secrets never appear in `.tf` files or state — the `secret_key_ref` pattern in the `cloud-run-service` module handles resolution at container startup
- Agent and worker are not publicly reachable (`allow_public = false`) — network isolation is enforced at the infrastructure level, not only at the application level

### Negative

- Cold starts add latency on the first request after scale-to-zero; mitigated by `min_instances = 1` but this means the minimum instance is always warm and billed
- Cloud Run stateless containers cannot hold queue state in-process — Redis (Memorystore) is required for BullMQ (see ADR-007), adding a managed Redis instance to operational surface
- Worker service on Cloud Run operates outside the standard request/response model — it must be kept alive as a long-running container with `min_instances >= 1` rather than scaling to zero between jobs
- Two SSE connections per chat turn (client → API → Agent) both run through Cloud Run; if the API instance is recycled mid-stream, the client connection is dropped (see ADR-011)

### Neutral

- All three services are containerized — same Terraform module and deployment model regardless of internal framework (NestJS, Fastify, BullMQ worker)
- GCP region `us-central1` is the default; changing region requires updating `var.region` and re-provisioning all resources

## Alternatives considered

- **GKE (Kubernetes)**: Provides more control over networking, sidecar injection, and persistent workloads. Rejected for MVP — cluster management, node pool sizing, networking configuration, and the operational burden of running Kubernetes are disproportionate to early-stage needs. Cloud Run covers the same containerized deployment model with far less overhead.
- **App Engine**: Managed PaaS with automatic scaling. Rejected — less control over container runtime configuration, no first-class support for arbitrary Docker images in the standard environment, and scaling behavior is less transparent than Cloud Run. Less aligned with the container-first workflow.
- **AWS ECS / Fargate**: Functionally comparable to Cloud Run. Considered — rejected in favor of GCP because the team had existing GCP familiarity. The database (Supabase, ADR-002) has no cloud-provider dependency, so the choice was free.
- **Fly.io**: Simpler developer experience for small services. Rejected — less mature Terraform provider, fewer enterprise-grade features (Secret Manager integration, Artifact Registry, IAM), and less team familiarity compared to GCP.
- **Pulumi / CDK**: Both are capable IaC tools. Terraform was chosen over Pulumi and CDK because of broader team familiarity with HCL and the mature, well-documented `hashicorp/google` provider ecosystem. Pulumi's multi-language support is not a current need; CDK's tight AWS coupling is a mismatch.

## References

- `infra/environments/prod/main.tf` — service configurations and Secret Manager references
- `infra/modules/cloud-run-service/` — reusable Cloud Run v2 module
- `infra/README.md` — structure, workflows, gotchas
- ADR-002: Supabase — database is Supabase-managed, outside this Terraform
- ADR-007: BullMQ + Redis — explains why Redis is required alongside Cloud Run
- ADR-011: SSE streaming — explains the two-connection SSE flow that runs through Cloud Run
