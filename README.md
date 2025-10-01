# Atlas on AWS via CloudFormation/CDK (with guard rails)

This repo deploys MongoDB Atlas **Projects** and **Clusters** using official **CloudFormation resource types** and the **Atlas CDK** library. It also includes **guard rails**:
- cfn-guard policy checks,
- synth-time validations,
- cdk-nag best-practice checks.

## Prereqs

1. **Activate MongoDB Atlas CloudFormation Extensions (Third-Party)**
   In the AWS console: CloudFormation → Registry → Public extensions → Provider: Third party → search **MongoDB::Atlas** → Activate in each account/region you will use. :contentReference[oaicite:9]{index=9}

2. **Create Atlas API Keys & store as a Secrets Manager profile**
   Create secret named `cfn/atlas/profile/{ProfileName}` with value `{"PublicKey":"…","PrivateKey":"…"}`.
   Provide the **profile name** (e.g., `default`) to all Atlas resources via the `Profile` property. :contentReference[oaicite:10]{index=10}

3. **Node 18+, AWS CDK v2** and AWS credentials.

## Deploy (CDK)

```bash
npm ci
export CDK_DEFAULT_ACCOUNT=<acct>
export CDK_DEFAULT_REGION=<region>
export ATLAS_ORG_ID=<your-atlas-org-id>
export ATLAS_PROFILE=default
export TRUSTED_CIDR=203.0.113.10/32
npm run build
npm run synth
npm run deploy
