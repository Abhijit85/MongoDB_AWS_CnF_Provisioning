# Guard rails

This folder contains optional policy-as-code assets that complement the runtime guard-rail aspect applied inside the CDK app.

* `policies/atlas-cluster.guard` – [`cfn-guard`](https://github.com/aws-cloudformation/cloudformation-guard) rules that enforce
  the same safeguards in a CI/CD pipeline or pre-deployment review.

## Running cfn-guard

```bash
npm run build
npx cdk synth > cdk.out/atlas-template.json
cfn-guard validate \
  --ruleset guardrails/policies/atlas-cluster.guard \
  --data cdk.out/atlas-template.json
```
