locals {
  atlas_profile_secret_name = "cfn/atlas/profile/${var.atlas_profile_name}"

  guardrails = jsondecode(file("${path.module}/guardrails/atlas-guardrails.json"))

  atlas_trusted_cidrs = [for cidr in distinct(var.atlas_trusted_cidrs) : trimspace(cidr) if cidr != ""]
}
