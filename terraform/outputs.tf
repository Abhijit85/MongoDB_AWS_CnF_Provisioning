output "atlas_project_id" {
  description = "Identifier of the MongoDB Atlas project provisioned by Terraform."
  value       = mongodbatlas_project.this.id
}

output "atlas_cluster_id" {
  description = "Identifier of the MongoDB Atlas cluster provisioned by Terraform."
  value       = mongodbatlas_cluster.this.cluster_id
}

output "atlas_database_user" {
  description = "Database user created for the Atlas project."
  value       = mongodbatlas_database_user.this.username
}
