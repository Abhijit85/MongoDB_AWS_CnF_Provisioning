variable "aws_region" {
  description = "AWS region that hosts the Secrets Manager secret with Atlas API keys."
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "Optional named AWS CLI profile used for authentication."
  type        = string
  default     = null
}

variable "atlas_profile_name" {
  description = "Name appended to cfn/atlas/profile/{name} for locating Atlas API keys in Secrets Manager."
  type        = string
  default     = "default"
}

variable "atlas_org_id" {
  description = "MongoDB Atlas organization identifier (24 character hex string)."
  type        = string
}

variable "atlas_project_name" {
  description = "Project name to create in MongoDB Atlas."
  type        = string
  default     = "aws-terraform-atlas-project"
}

variable "atlas_cluster_name" {
  description = "Cluster name to create within the Atlas project."
  type        = string
  default     = "aws-terraform-atlas-cluster"
}

variable "atlas_cluster_region" {
  description = "Primary Atlas region for the cluster (for example US_EAST_1)."
  type        = string
  default     = "US_EAST_1"
}

variable "atlas_cluster_instance_size" {
  description = "Atlas cluster instance size (M10, M20, M30, etc.)."
  type        = string
  default     = "M10"
}

variable "cluster_backup_enabled" {
  description = "Whether Cloud Backups should be enabled on the Atlas cluster."
  type        = bool
  default     = true
}

variable "cluster_node_count" {
  description = "Number of electable nodes provisioned for the cluster."
  type        = number
  default     = 3
}

variable "mongo_db_major_version" {
  description = "MongoDB major version to deploy."
  type        = string
  default     = "7.0"
}

variable "atlas_db_username" {
  description = "Database username provisioned within the Atlas cluster."
  type        = string
  default     = "atlas-user"
}

variable "atlas_db_user_password" {
  description = "Password for the Atlas database user. Prefer sourcing this from a secure secrets store."
  type        = string
  sensitive   = true
}

variable "atlas_trusted_cidrs" {
  description = "List of CIDR blocks allowed to access the Atlas project."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
