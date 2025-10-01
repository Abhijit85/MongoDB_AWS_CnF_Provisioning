# MongoDB Atlas provisioning on AWS with guard rails

This repository demonstrates how to deploy MongoDB Atlas resources on AWS by combining the
[MongoDB CloudFormation resource provider](https://github.com/mongodb/mongodbatlas-cloudformation-resources)
with the [Atlas CDK constructs](https://constructs.dev/packages/awscdk-resources-mongodbatlas/v/3.13.0?lang=typescript).
The TypeScript CDK app provisions a full Atlas project, an M-series replica-set cluster, a database user, and an IP access list.

To keep environments lean, the app layers multiple **guard rails** on top of the base infrastructure:

* **`AtlasGuardRailAspect`** – a CDK aspect that validates cluster counts, instance sizes, and backup settings at synth time.
* **`cdk-nag` (AWS Solutions checks)** – highlights common AWS misconfigurations early in development.
* **CloudFormation Guard policies** – reusable rules (located in [`guardrails/policies`](guardrails/policies)) to enforce standards inside CI/CD pipelines.

## Project structure

```
.
├── bin/                     # CDK application entry point
├── src/                     # CDK stacks and guard-rail logic
├── guardrails/              # Optional cfn-guard policies and docs
├── cdk.json                 # CDK configuration
├── package.json             # Project dependencies and NPM scripts
└── tsconfig.json            # TypeScript compiler configuration
```

## Prerequisites

1. **MongoDB Atlas API keys** stored in AWS Secrets Manager under `cfn/atlas/profile/<ProfileName>`.
2. **MongoDB Atlas CloudFormation resources** activated in every AWS account/region used.
3. **Node.js 18+** and the **AWS CDK v2 CLI** installed locally.
4. **cfn-guard** CLI (optional) for policy validation.

## Bootstrap & installation

```bash
npm install
npx cdk bootstrap aws://<ACCOUNT>/<REGION>
```

## Configuring deployment parameters

You can pass common Atlas settings through either **CDK context** or **CloudFormation parameters**.

*Context overrides* (set in `cdk.json`, via CLI `--context`, or environment variables):

| Context key       | Description                                             | Default |
| ----------------- | ------------------------------------------------------- | ------- |
| `atlasProfile`    | Secrets Manager profile name holding Atlas API keys.    | `default` |

*CloudFormation parameters* (prompted during `cdk deploy` or via `--parameters`):

| Parameter name            | Purpose                                               | Default |
| ------------------------- | ----------------------------------------------------- | ------- |
| `AtlasOrgId`              | Atlas organization ID that owns the project.          | _(required)_ |
| `AtlasProjectName`        | Project name within Atlas.                            | `aws-cdk-atlas-project` |
| `AtlasClusterName`        | Cluster name.                                         | `aws-cdk-atlas-cluster` |
| `AtlasClusterRegion`      | Primary Atlas region (for example `US_EAST_1`).       | `US_EAST_1` |
| `AtlasClusterInstanceSize`| Cluster tier (`M10`, `M20`, or `M30`).                | `M10` |
| `MongoDbMajorVersion`     | MongoDB major version.                                | `7.0` |
| `AtlasDbUsername`         | Database user name created by the stack.              | `atlas-user` |
| `AtlasDbUserPassword`     | Password for the user (mark as `NoEcho` in CloudFormation). | _(required)_ |
| `AtlasTrustedCidrs`       | List of trusted CIDR blocks allowed to access Atlas. | `['0.0.0.0/0']` |
| `AtlasProfileName`        | Name of the Secrets Manager profile (defaults to context). | `default` |

## Synthesising and deploying

```bash
npm run build
npm run synth
npm run deploy -- \
  --parameters AtlasOrgId=<ORG_ID> \
  --parameters AtlasDbUserPassword=<STRONG_PASSWORD>
```

After deployment, the stack outputs the Atlas project and cluster IDs for downstream automation.

## Running guard rails manually

The CDK aspect runs automatically during `synth`. To execute policy-as-code checks using
[`cfn-guard`](https://github.com/aws-cloudformation/cloudformation-guard):

```bash
npm run build
npx cdk synth > cdk.out/atlas-template.json
cfn-guard validate \
  --ruleset guardrails/policies/atlas-cluster.guard \
  --data cdk.out/atlas-template.json
```

## Cleaning up

```bash
npm run destroy
```

Remember to remove the generated Atlas project or rotate any Atlas API credentials when finished.
