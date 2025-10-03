#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MongoDbAtlasClusterStack } from '../src/atlas-cluster-stack';
import { GuardRailStage } from '../src/guard-rail-stage';

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const bootstrapQualifier =
  process.env.CDK_DEFAULT_QUALIFIER ??
  process.env.CDK_QUALIFIER ??
  app.node.tryGetContext('@aws-cdk/core:bootstrapQualifier');

const synthesizer = bootstrapQualifier
  ? new cdk.DefaultStackSynthesizer({ qualifier: bootstrapQualifier })
  : undefined;

const atlasClusterStage = new GuardRailStage(app, 'MongoDbAtlasStage', {
  env,
  guardRailConfig: {
    maxClusterCount: 3,
    approvedInstanceSizes: ['M10', 'M20', 'M30'],
    requireBackupEnabled: true,
  },
});

new MongoDbAtlasClusterStack(atlasClusterStage, 'MongoDbAtlasStack', {
  env,
  synthesizer,
});

app.synth();
