terraform {
  required_version = ">= 1.5.0"

  required_providers {
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.14"
    }

    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}
