resource "google_redis_instance" "autodidact" {
  name           = "autodidact-redis"
  tier           = "STANDARD_HA"
  memory_size_gb = var.memory_size_gb
  region         = var.region
  redis_version  = "REDIS_7_0"
  display_name   = "Autodidact Redis"
}

output "host" {
  value = google_redis_instance.autodidact.host
}

output "port" {
  value = google_redis_instance.autodidact.port
}

output "redis_url" {
  value     = "redis://${google_redis_instance.autodidact.host}:${google_redis_instance.autodidact.port}"
  sensitive = true
}
