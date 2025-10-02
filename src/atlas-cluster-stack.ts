import * as cdk from 'aws-cdk-lib';
import {
  AdvancedRegionConfigProviderName,
  AtlasBasic,
} from 'awscdk-resources-mongodbatlas';
import { Construct } from 'constructs';

/**
 * Stack that provisions a MongoDB Atlas project, cluster, database user, and IP access list.
 */
export class MongoDbAtlasClusterStack extends cdk.Stack {
  public readonly atlasDeployment: AtlasBasic;

  /**
   * Create a new MongoDB Atlas provisioning stack.
   * @param {Construct} scope Parent construct.
   * @param {string} id Stack identifier.
   * @param {cdk.StackProps} [props] Optional stack configuration.
   */
  public constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const profileContext = this.node.tryGetContext('atlasProfile');

    const profileParam = new cdk.CfnParameter(this, 'AtlasProfileName', {
      type: 'String',
      description:
        'Name of the Secrets Manager profile (cfn/atlas/profile/{name}) that stores Atlas API keys.',
      default: profileContext ?? 'default',
    });

    const orgIdParam = new cdk.CfnParameter(this, 'AtlasOrgId', {
      type: 'String',
      description: 'MongoDB Atlas organization identifier (24 character hex string).',
    });

    const projectNameParam = new cdk.CfnParameter(this, 'AtlasProjectName', {
      type: 'String',
      description: 'Name to assign to the MongoDB Atlas project.',
      default: 'aws-cdk-atlas-project',
    });

    const clusterNameParam = new cdk.CfnParameter(this, 'AtlasClusterName', {
      type: 'String',
      description: 'Name to assign to the Atlas cluster.',
      default: 'aws-cdk-atlas-cluster',
    });

    const clusterRegionParam = new cdk.CfnParameter(this, 'AtlasClusterRegion', {
      type: 'String',
      description: 'Primary region for the Atlas cluster (Atlas region name such as AWS_US_EAST_1).',
      default: 'US_EAST_1',
    });

    const instanceSizeParam = new cdk.CfnParameter(this, 'AtlasClusterInstanceSize', {
      type: 'String',
      description: 'Cluster instance size (M10, M20, etc.).',
      allowedValues: ['M10', 'M20', 'M30'],
      default: 'M10',
    });

    const mongoDbVersionParam = new cdk.CfnParameter(this, 'MongoDbMajorVersion', {
      type: 'String',
      description: 'MongoDB major version to deploy.',
      default: '7.0',
    });

    const dbUsernameParam = new cdk.CfnParameter(this, 'AtlasDbUsername', {
      type: 'String',
      description: 'Database user name created in the Atlas project.',
      default: 'atlas-user',
    });

    const dbPasswordParam = new cdk.CfnParameter(this, 'AtlasDbUserPassword', {
      type: 'String',
      description: 'Strong password for the database user. Consider sourcing from AWS Secrets Manager.',
      noEcho: true,
    });

    const ipAccessListParam = new cdk.CfnParameter(this, 'AtlasTrustedCidrs', {
      type: 'String',
      description:
        'CIDR block that should be allowed to connect to the cluster. Provide additional entries by forking the stack or extending the resource.',
      default: '0.0.0.0/0',
    });

    this.atlasDeployment = new AtlasBasic(this, 'AtlasDeployment', {
      profile: profileParam.valueAsString,
      projectProps: {
        name: projectNameParam.valueAsString,
        orgId: orgIdParam.valueAsString,
      },
      clusterProps: {
        name: clusterNameParam.valueAsString,
        mongoDbMajorVersion: mongoDbVersionParam.valueAsString,
        backupEnabled: true,
        clusterType: 'REPLICASET',
        replicationSpecs: [
          {
            numShards: 1,
            advancedRegionConfigs: [
              {
                providerName: AdvancedRegionConfigProviderName.AWS,
                regionName: clusterRegionParam.valueAsString,
                electableSpecs: {
                  instanceSize: instanceSizeParam.valueAsString,
                  nodeCount: 3,
                },
              },
            ],
          },
        ],
      },
      dbUserProps: {
        username: dbUsernameParam.valueAsString,
        password: dbPasswordParam.valueAsString,
        databaseName: 'admin',
        roles: [
          {
            roleName: 'atlasAdmin',
            databaseName: 'admin',
          },
        ],
      },
      ipAccessListProps: {
        accessList: [
          {
            cidrBlock: ipAccessListParam.valueAsString,
            comment: 'Managed by AWS CDK guard-railed deployment.',
          },
        ],
      },
    });

    new cdk.CfnOutput(this, 'AtlasProjectId', {
      description: 'Identifier of the provisioned Atlas project.',
      value: this.atlasDeployment.mProject.attrId,
    });

    new cdk.CfnOutput(this, 'AtlasClusterId', {
      description: 'Identifier of the provisioned Atlas cluster.',
      value: this.atlasDeployment.mCluster.attrId,
    });
  }
}
