provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

data "aws_secretsmanager_secret_version" "atlas_profile" {
  secret_id = local.atlas_profile_secret_name
}

locals {
  atlas_api_credentials = jsondecode(data.aws_secretsmanager_secret_version.atlas_profile.secret_string)
}

provider "mongodbatlas" {
  public_key  = local.atlas_api_credentials.publicKey
  private_key = local.atlas_api_credentials.privateKey
}

resource "mongodbatlas_project" "this" {
  name   = var.atlas_project_name
  org_id = var.atlas_org_id

  lifecycle {
    precondition {
      condition     = try(local.guardrails.require_ip_access_list, false) == false ? true : length(local.atlas_trusted_cidrs) > 0
      error_message = "Guard rails require at least one CIDR block in atlas_trusted_cidrs."
    }
  }
}

resource "mongodbatlas_cluster" "this" {
  project_id             = mongodbatlas_project.this.id
  name                   = var.atlas_cluster_name
  cluster_type           = "REPLICASET"
  mongo_db_major_version = var.mongo_db_major_version
  backup_enabled         = var.cluster_backup_enabled

  replication_specs {
    num_shards = 1

    region_configs {
      provider_name = "AWS"
      region_name   = var.atlas_cluster_region

      electable_specs {
        instance_size = var.atlas_cluster_instance_size
        node_count    = var.cluster_node_count
      }
    }
  }

  lifecycle {
    precondition {
      condition     = 1 <= try(local.guardrails.max_cluster_count, 1)
      error_message = "Guard rails configuration forbids provisioning any clusters (max_cluster_count < 1)."
    }

    precondition {
      condition     = length(try(local.guardrails.approved_instance_sizes, [])) == 0 ? true : contains(try(local.guardrails.approved_instance_sizes, []), var.atlas_cluster_instance_size)
      error_message = "Cluster instance size must match one of the approved_instance_sizes defined in guardrails/atlas-guardrails.json."
    }

    precondition {
      condition     = try(local.guardrails.require_backup_enabled, false) == false ? true : var.cluster_backup_enabled
      error_message = "Guard rails require the cluster to keep Cloud Backups enabled."
    }

    precondition {
      condition     = var.cluster_node_count == try(local.guardrails.required_node_count, var.cluster_node_count)
      error_message = "Guard rails require the cluster node count to match required_node_count."
    }
  }
}

resource "mongodbatlas_database_user" "this" {
  username           = var.atlas_db_username
  password           = var.atlas_db_user_password
  project_id         = mongodbatlas_project.this.id
  auth_database_name = "admin"

  roles {
    role_name     = "atlasAdmin"
    database_name = "admin"
  }
}

resource "mongodbatlas_project_ip_access_list" "cidr" {
  for_each = toset(local.atlas_trusted_cidrs)

  project_id = mongodbatlas_project.this.id
  cidr_block = each.value
  comment    = "Managed by Terraform guard-railed deployment."
}
