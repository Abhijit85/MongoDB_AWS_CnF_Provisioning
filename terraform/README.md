# MongoDB Atlas Terraform deployment

This Terraform configuration mirrors the CDK stack by provisioning a MongoDB Atlas project, replica-set cluster, database user, and project IP access list. It shares the same guard-rail intent through `guardrails/atlas-guardrails.json`, which constrains key inputs during `terraform plan` and `terraform apply`.

## Prerequisites

* Terraform CLI v1.5 or newer.
* AWS credentials with permission to read the `cfn/atlas/profile/<name>` secret in Secrets Manager.
* MongoDB Atlas API keys stored as JSON (`{"publicKey":"…","privateKey":"…"}`) in the secret `cfn/atlas/profile/<name>`, matching the CDK workflow.

## Usage

```bash
cd terraform
terraform init
terraform plan \
  -var atlas_org_id=<ORG_ID> \
  -var atlas_db_user_password=<PASSWORD>
terraform apply
'terraform output' # view cluster and project identifiers
```

Optional variables:

* `aws_region` (default `us-east-1`) – where the Atlas API secret lives.
* `aws_profile` – named AWS profile to use.
* `atlas_profile_name` (default `default`) – suffix for `cfn/atlas/profile/{name}`.
* `atlas_project_name`, `atlas_cluster_name`, `atlas_cluster_region`, `atlas_cluster_instance_size`, `mongo_db_major_version`, `atlas_db_username`, `atlas_trusted_cidrs` – match the CDK parameters with similar defaults.

Secrets should be provided through environment variables (`TF_VAR_atlas_db_user_password`) or a secure remote state workflow rather than committing them.

## Guard rails

`guardrails/atlas-guardrails.json` centralises constraints such as approved instance sizes, mandatory backups, required node count, and IP access list requirements. The Terraform resources enforce these rules using `precondition` blocks. Adjust the JSON and re-run `terraform plan` to tighten or relax governance without touching the configuration logic.
