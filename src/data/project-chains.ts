export interface ProjectChainReward {
  readonly buildTimeMultiplier?: number;
  readonly locMultiplier?: number;
  readonly momentum?: number;
  readonly payoutMultiplier?: number;
  readonly revenueMultiplier?: number;
  readonly rpMultiplier?: number;
}

export interface ProjectChainDefinition {
  readonly descriptionKey: string;
  readonly id: string;
  readonly nameKey: string;
  readonly projectIds: readonly string[];
  readonly reward: ProjectChainReward;
}

export const PROJECT_CHAINS: readonly ProjectChainDefinition[] = [
  {
    id: "chain_e1_launch",
    nameKey: "projectChain.chain_e1_launch.name",
    descriptionKey: "projectChain.chain_e1_launch.description",
    projectIds: ["p_llama_todo", "p_landing", "p_scope_creep"],
    reward: {
      momentum: 8,
      payoutMultiplier: 1.01
    }
  },
  {
    id: "chain_saas_loop",
    nameKey: "projectChain.chain_saas_loop.name",
    descriptionKey: "projectChain.chain_saas_loop.description",
    projectIds: ["p_micro_saas", "p_chirper_bot", "p_mvp", "p_dashboard"],
    reward: {
      buildTimeMultiplier: 0.99,
      momentum: 10,
      revenueMultiplier: 1.02
    }
  },
  {
    id: "chain_enterprise_stack",
    nameKey: "projectChain.chain_enterprise_stack.name",
    descriptionKey: "projectChain.chain_enterprise_stack.description",
    projectIds: ["p_enterprise_mig", "p_compliance", "p_ai_pair_programmer", "p_cloud_platform"],
    reward: {
      momentum: 12,
      revenueMultiplier: 1.03,
      rpMultiplier: 1.02
    }
  },
  {
    id: "chain_world_systems",
    nameKey: "projectChain.chain_world_systems.name",
    descriptionKey: "projectChain.chain_world_systems.description",
    projectIds: ["p_banking_core", "p_self_driving", "p_city_os", "p_synth_workforce"],
    reward: {
      locMultiplier: 1.03,
      momentum: 14,
      payoutMultiplier: 1.03
    }
  },
  {
    id: "chain_omega_path",
    nameKey: "projectChain.chain_omega_path.name",
    descriptionKey: "projectChain.chain_omega_path.description",
    projectIds: [
      "p_logistics_brain",
      "p_climate_rewrite",
      "p_mind_upload",
      "p_reality_patch",
      "p_planetary_os",
      "p_omega_request"
    ],
    reward: {
      momentum: 18,
      revenueMultiplier: 1.05,
      rpMultiplier: 1.05
    }
  }
] as const;
