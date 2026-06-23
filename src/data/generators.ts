import { big, type Big } from "../core/bignum";

export interface GeneratorDefinition {
  readonly baseCost: Big;
  readonly baseRate: Big;
  readonly computeUse: number;
  readonly debtReductionPerSecond?: number;
  readonly demoLocked?: boolean;
  readonly era: number;
  readonly growth: number;
  readonly id: string;
  readonly nameKey: string;
  readonly previousId?: string;
}

export const GENERATORS: readonly GeneratorDefinition[] = [
  {
    id: "g_autocomplete",
    era: 1,
    nameKey: "gen.g_autocomplete.name",
    baseCost: big(30),
    growth: 1.1,
    baseRate: big(0.5),
    computeUse: 1
  },
  {
    id: "g_parrot",
    era: 1,
    nameKey: "gen.g_parrot.name",
    baseCost: big(800),
    growth: 1.11,
    baseRate: big(4),
    computeUse: 2,
    previousId: "g_autocomplete"
  },
  {
    id: "g_macro",
    era: 1,
    nameKey: "gen.g_macro.name",
    baseCost: big(1.2e4),
    growth: 1.11,
    baseRate: big(30),
    computeUse: 3,
    previousId: "g_parrot"
  },
  {
    id: "g_muse_junior",
    era: 2,
    nameKey: "gen.g_muse_junior.name",
    baseCost: big(2e5),
    growth: 1.12,
    baseRate: big(220),
    computeUse: 5
  },
  {
    id: "g_muse_pair",
    era: 2,
    nameKey: "gen.g_muse_pair.name",
    baseCost: big(2.5e6),
    growth: 1.12,
    baseRate: big(1.6e3),
    computeUse: 8,
    previousId: "g_muse_junior"
  },
  {
    id: "g_qa_bot",
    era: 2,
    nameKey: "gen.g_qa_bot.name",
    baseCost: big(1.6e7),
    growth: 1.13,
    baseRate: big(800),
    debtReductionPerSecond: 0.005,
    computeUse: 10,
    previousId: "g_muse_pair"
  },
  {
    id: "g_intern_swarm",
    era: 3,
    demoLocked: true,
    nameKey: "gen.g_intern_swarm.name",
    baseCost: big(2.5e7),
    growth: 1.12,
    baseRate: big(1.2e4),
    computeUse: 12
  },
  {
    id: "g_golem_worker",
    era: 3,
    demoLocked: true,
    nameKey: "gen.g_golem_worker.name",
    baseCost: big(3e8),
    growth: 1.12,
    baseRate: big(9e4),
    computeUse: 16,
    previousId: "g_intern_swarm"
  },
  {
    id: "g_ci_pipeline",
    era: 3,
    demoLocked: true,
    nameKey: "gen.g_ci_pipeline.name",
    baseCost: big(3.5e9),
    growth: 1.13,
    baseRate: big(7e5),
    computeUse: 20,
    previousId: "g_golem_worker"
  },
  {
    id: "g_hydra_heads",
    era: 4,
    demoLocked: true,
    nameKey: "gen.g_hydra_heads.name",
    baseCost: big(4e10),
    growth: 1.12,
    baseRate: big(5.5e6),
    computeUse: 30
  },
  {
    id: "g_test_legion",
    era: 4,
    demoLocked: true,
    nameKey: "gen.g_test_legion.name",
    baseCost: big(5e11),
    growth: 1.13,
    baseRate: big(4e7),
    computeUse: 40,
    previousId: "g_hydra_heads"
  },
  {
    id: "g_refactor_daemon",
    era: 4,
    demoLocked: true,
    nameKey: "gen.g_refactor_daemon.name",
    baseCost: big(6e12),
    growth: 1.13,
    baseRate: big(3e8),
    debtReductionPerSecond: 0.02,
    computeUse: 50,
    previousId: "g_test_legion"
  },
  {
    id: "g_oracle_node",
    era: 5,
    demoLocked: true,
    nameKey: "gen.g_oracle_node.name",
    baseCost: big(8e13),
    growth: 1.12,
    baseRate: big(2.5e9),
    computeUse: 80
  },
  {
    id: "g_dev_collective",
    era: 5,
    demoLocked: true,
    nameKey: "gen.g_dev_collective.name",
    baseCost: big(1e15),
    growth: 1.12,
    baseRate: big(2e10),
    computeUse: 110,
    previousId: "g_oracle_node"
  },
  {
    id: "g_arch_synth",
    era: 5,
    demoLocked: true,
    nameKey: "gen.g_arch_synth.name",
    baseCost: big(1.2e16),
    growth: 1.13,
    baseRate: big(1.5e11),
    computeUse: 150,
    previousId: "g_dev_collective"
  },
  {
    id: "g_titan_forge",
    era: 6,
    demoLocked: true,
    nameKey: "gen.g_titan_forge.name",
    baseCost: big(1.6e17),
    growth: 1.12,
    baseRate: big(1.2e12),
    computeUse: 240
  },
  {
    id: "g_mono_swarm",
    era: 6,
    demoLocked: true,
    nameKey: "gen.g_mono_swarm.name",
    baseCost: big(2e18),
    growth: 1.12,
    baseRate: big(9e12),
    computeUse: 330,
    previousId: "g_titan_forge"
  },
  {
    id: "g_demiurge_shard",
    era: 7,
    demoLocked: true,
    nameKey: "gen.g_demiurge_shard.name",
    baseCost: big(3e19),
    growth: 1.11,
    baseRate: big(7e13),
    computeUse: 500
  },
  {
    id: "g_reality_compiler",
    era: 7,
    demoLocked: true,
    nameKey: "gen.g_reality_compiler.name",
    baseCost: big(4e20),
    growth: 1.12,
    baseRate: big(5.5e14),
    computeUse: 700,
    previousId: "g_demiurge_shard"
  },
  {
    id: "g_dream_team",
    era: 7,
    demoLocked: true,
    nameKey: "gen.g_dream_team.name",
    baseCost: big(5e21),
    growth: 1.12,
    baseRate: big(4.5e15),
    computeUse: 950,
    previousId: "g_reality_compiler"
  },
  {
    id: "g_ouro_loop",
    era: 8,
    demoLocked: true,
    nameKey: "gen.g_ouro_loop.name",
    baseCost: big(7e22),
    growth: 1.11,
    baseRate: big(3.5e16),
    computeUse: 1.4e3
  },
  {
    id: "g_self_writer",
    era: 8,
    demoLocked: true,
    nameKey: "gen.g_self_writer.name",
    baseCost: big(9e23),
    growth: 1.11,
    baseRate: big(3e17),
    computeUse: 2e3,
    previousId: "g_ouro_loop"
  },
  {
    id: "g_basilisk_eye",
    era: 9,
    demoLocked: true,
    nameKey: "gen.g_basilisk_eye.name",
    baseCost: big(1.2e25),
    growth: 1.1,
    baseRate: big(2.5e18),
    computeUse: 3e3
  },
  {
    id: "g_acausal_dev",
    era: 9,
    demoLocked: true,
    nameKey: "gen.g_acausal_dev.name",
    baseCost: big(1.6e26),
    growth: 1.1,
    baseRate: big(2e19),
    computeUse: 4.2e3,
    previousId: "g_basilisk_eye"
  },
  {
    id: "g_omega_fragment",
    era: 10,
    demoLocked: true,
    nameKey: "gen.g_omega_fragment.name",
    baseCost: big(2e27),
    growth: 1.1,
    baseRate: big(1.8e20),
    computeUse: 6e3
  },
  {
    id: "g_the_loop",
    era: 10,
    demoLocked: true,
    nameKey: "gen.g_the_loop.name",
    baseCost: big(1e29),
    growth: 1.1,
    baseRate: big(1.5e21),
    computeUse: 9e3,
    previousId: "g_omega_fragment"
  }
] as const;
