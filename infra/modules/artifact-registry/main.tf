resource "google_artifact_registry_repository" "autodidact" {
  location      = var.region
  repository_id = "autodidact"
  description   = "Docker images for Autodidact services"
  format        = "DOCKER"
}

output "registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/autodidact"
}
