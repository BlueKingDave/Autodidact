module "artifact_registry" {
  source     = "../../modules/artifact-registry"
  project_id = var.project_id
  region     = var.region
}

module "redis" {
  source         = "../../modules/redis"
  region         = var.region
  memory_size_gb = 1
}

locals {
  registry = module.artifact_registry.registry_url
  sa_email = "${var.service_account_name}@${var.project_id}.iam.gserviceaccount.com"

  # Secrets stored in Secret Manager — referenced by name, not value
  common_secrets = {
    DATABASE_URL             = "autodidact-database-url"
    REDIS_URL                = "autodidact-redis-url"
    SUPABASE_URL             = "autodidact-supabase-url"
    SUPABASE_JWT_SECRET      = "autodidact-supabase-jwt-secret"
    SUPABASE_SERVICE_ROLE_KEY = "autodidact-supabase-service-role-key"
    OPENAI_API_KEY           = "autodidact-openai-api-key"
    OTEL_EXPORTER_OTLP_ENDPOINT = "autodidact-otel-endpoint"
  }
}

module "api" {
  source                = "../../modules/cloud-run-service"
  service_name          = "autodidact-api"
  region                = var.region
  image                 = "${local.registry}/api:latest"
  min_instances         = 1
  max_instances         = 10
  cpu                   = "1"
  memory                = "512Mi"
  service_account_email = local.sa_email
  allow_public          = true
  env_vars              = merge(local.common_secrets, {
    AGENT_SERVICE_URL = "autodidact-agent-service-url"
    API_PORT          = "autodidact-api-port"
    LLM_PROVIDER      = "autodidact-llm-provider"
    AUTH_PROVIDER     = "autodidact-auth-provider"
    QUEUE_PROVIDER    = "autodidact-queue-provider"
  })
}

module "agent" {
  source                = "../../modules/cloud-run-service"
  service_name          = "autodidact-agent"
  region                = var.region
  image                 = "${local.registry}/agent:latest"
  min_instances         = 1
  max_instances         = 5
  cpu                   = "2"
  memory                = "2Gi"
  service_account_email = local.sa_email
  allow_public          = false
  env_vars              = merge(local.common_secrets, {
    AGENT_PORT        = "autodidact-agent-port"
    LLM_PROVIDER      = "autodidact-llm-provider"
    EMBEDDING_PROVIDER = "autodidact-embedding-provider"
    CHECKPOINTER      = "autodidact-checkpointer"
  })
}

module "worker" {
  source                = "../../modules/cloud-run-service"
  service_name          = "autodidact-worker"
  region                = var.region
  image                 = "${local.registry}/worker:latest"
  min_instances         = 1
  max_instances         = 3
  cpu                   = "1"
  memory                = "512Mi"
  service_account_email = local.sa_email
  allow_public          = false
  env_vars              = merge(local.common_secrets, {
    AGENT_SERVICE_URL = "autodidact-agent-service-url"
    QUEUE_PROVIDER    = "autodidact-queue-provider"
  })
}

output "api_url"    { value = module.api.service_url }
output "agent_url"  { value = module.agent.service_url }
output "worker_url" { value = module.worker.service_url }
