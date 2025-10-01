import { Annotations, Aspects, IAspect, Stage, StageProps } from 'aws-cdk-lib';
import {
  AdvancedRegionConfig,
  AdvancedReplicationSpec,
  CfnCluster,
  Specs,
} from 'awscdk-resources-mongodbatlas';
import { AwsSolutionsChecks } from 'cdk-nag';
import { Construct, IConstruct } from 'constructs';

/**
 * Configuration options for Atlas guard rails.
 */
export interface GuardRailConfig {
  /** Maximum number of clusters allowed in a single deployment stage. */
  readonly maxClusterCount: number;
  /** Approved Atlas instance sizes (e.g. `M10`, `M20`). */
  readonly approvedInstanceSizes: string[];
  /** Require automated backups to be enabled for every cluster. */
  readonly requireBackupEnabled: boolean;
}

/**
 * Stage properties extended with guard rail configuration.
 */
export interface GuardRailStageProps extends StageProps {
  /** Guard rail configuration that is applied to all stacks within the stage. */
  readonly guardRailConfig: GuardRailConfig;
}

/**
 * Deployment stage that automatically applies governance guard rails and best-practice checks.
 */
export class GuardRailStage extends Stage {
  /** Guard rail configuration currently enforced by the stage. */
  public readonly guardRailConfig: GuardRailConfig;

  /**
   * Create a new stage that automatically applies guard rails to contained stacks.
   * @param {Construct} scope Parent construct.
   * @param {string} id Stage identifier.
   * @param {GuardRailStageProps} props Stage configuration.
   */
  public constructor(scope: Construct, id: string, props: GuardRailStageProps) {
    super(scope, id, props);

    this.guardRailConfig = props.guardRailConfig;

    Aspects.of(this).add(new AtlasGuardRailAspect(props.guardRailConfig));
    Aspects.of(this).add(new AwsSolutionsChecks({ verbose: true }));
  }
}

/**
 * CDK aspect that enforces simple governance rules for Atlas clusters.
 */
export class AtlasGuardRailAspect implements IAspect {
  private clusterCount = 0;

  /**
   * Initialise the aspect with guard rail configuration.
   * @param {GuardRailConfig} config Guard rail configuration to enforce.
   */
  public constructor(private readonly config: GuardRailConfig) {}

  /**
   * Visit constructs in the tree and enforce guard rails on Atlas clusters.
   * @param {IConstruct} node Construct currently being inspected.
   */
  public visit(node: IConstruct): void {
    if (node instanceof CfnCluster) {
      this.clusterCount += 1;
      this.validateClusterCount(node);
      this.validateBackups(node);
      this.validateInstanceSizes(node);
    }
  }

  /**
   * Ensure the number of clusters defined in the stage does not exceed the configured limit.
   * @param {CfnCluster} node Cluster under evaluation.
   */
  private validateClusterCount(node: CfnCluster): void {
    if (this.clusterCount > this.config.maxClusterCount) {
      Annotations.of(node).addError(
        `Guard rail violation: stage already defines ${this.clusterCount - 1} cluster(s); ` +
          `adding '${node.node.path}' exceeds the limit of ${this.config.maxClusterCount}.`,
      );
    }
  }

  /**
   * Ensure automated backups remain enabled when the guard rail requires it.
   * @param {CfnCluster} node Cluster under evaluation.
   */
  private validateBackups(node: CfnCluster): void {
    if (this.config.requireBackupEnabled && node.props.backupEnabled !== true) {
      Annotations.of(node).addWarning(
        'Guard rail warning: Automated backups should be enabled for Atlas clusters.',
      );
    }
  }

  /**
   * Ensure instance sizes used in the cluster are part of the approved list.
   * @param {CfnCluster} node Cluster under evaluation.
   */
  private validateInstanceSizes(node: CfnCluster): void {
    if (this.config.approvedInstanceSizes.length === 0) {
      return;
    }

    const sizes = this.extractInstanceSizes(node.props.replicationSpecs);
    const unauthorized = sizes.filter(
      (size) => !this.config.approvedInstanceSizes.includes(size),
    );

    if (unauthorized.length > 0) {
      const unique = Array.from(new Set(unauthorized)).sort();
      Annotations.of(node).addError(
        `Guard rail violation: instance sizes [${unique.join(
          ', ',
        )}] are not approved. Approved sizes: ${this.config.approvedInstanceSizes.join(', ')}.`,
      );
    }
  }

  /**
   * Extract every instance size from replication specifications.
   * @param {AdvancedReplicationSpec[]} [replicationSpecs] Replication specification list to inspect.
   * @returns {string[]} All instance sizes referenced in the specs.
   */
  private extractInstanceSizes(
    replicationSpecs?: AdvancedReplicationSpec[],
  ): string[] {
    if (!replicationSpecs) {
      return [];
    }

    const sizes: string[] = [];
    for (const spec of replicationSpecs) {
      const regionConfigs = spec.advancedRegionConfigs ?? [];
      for (const region of regionConfigs) {
        sizes.push(...this.collectSizesFromRegion(region));
      }
    }

    return sizes;
  }

  /**
   * Collect all instance sizes defined in a single region configuration.
   * @param {AdvancedRegionConfig} region Region configuration being inspected.
   * @returns {string[]} Instance sizes referenced in the region configuration.
   */
  private collectSizesFromRegion(region: AdvancedRegionConfig): string[] {
    const specsToInspect: (Specs | undefined)[] = [
      region.analyticsSpecs,
      region.electableSpecs,
      region.readOnlySpecs,
    ];

    const sizes: string[] = [];
    for (const spec of specsToInspect) {
      if (spec?.instanceSize) {
        sizes.push(spec.instanceSize);
      }
    }

    return sizes;
  }
}
