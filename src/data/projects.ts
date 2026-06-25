import { big, type Big } from "../core/bignum";
import { AURORA_SEED_AVAILABLE_FLAG, type AuroraCompletionEffect } from "./aurora";
import type { Condition } from "./conditions";

export type ProjectKind = "refactor" | "standard" | "unlock";

export interface ProjectDefinition {
  readonly bugResistant?: boolean;
  readonly buildS: number;
  readonly completionEffect?: AuroraCompletionEffect;
  readonly costLoC: Big;
  readonly demoLocked?: boolean;
  readonly era: number;
  readonly hypeBonus?: number;
  readonly id: string;
  readonly kind: ProjectKind;
  readonly nameKey: string;
  readonly recurringRevenue?: boolean;
  readonly rpFirst?: number;
  readonly rpReward?: number;
  readonly unlock?: Condition;
  readonly valueRatio: number;
}

export const PROJECT_REVENUE_LEVEL_BONUS = 2.5;
export const PROJECT_MAX_LEVEL = 10;

const CORE_PROJECTS: readonly ProjectDefinition[] = [
  {
    id: "p_llama_todo",
    era: 1,
    nameKey: "project.p_llama_todo.name",
    costLoC: big(75),
    valueRatio: 0.45,
    buildS: 45,
    kind: "standard",
    recurringRevenue: false
  },
  {
    id: "p_landing",
    era: 1,
    nameKey: "project.p_landing.name",
    costLoC: big(1.2e3),
    valueRatio: 0.55,
    buildS: 75,
    kind: "standard"
  },
  {
    id: "p_scope_creep",
    era: 1,
    nameKey: "project.p_scope_creep.name",
    costLoC: big(9e3),
    valueRatio: 0.6,
    buildS: 120,
    kind: "standard",
    rpReward: 1,
    rpFirst: 3
  },
  {
    id: "p_micro_saas",
    era: 2,
    nameKey: "project.p_micro_saas.name",
    costLoC: big(1.5e5),
    valueRatio: 0.75,
    buildS: 80,
    kind: "standard",
    hypeBonus: 0.3
  },
  {
    id: "p_chirper_bot",
    era: 2,
    nameKey: "project.p_chirper_bot.name",
    costLoC: big(9e5),
    valueRatio: 0.65,
    buildS: 90,
    kind: "standard",
    hypeBonus: 0.5
  },
  {
    id: "p_mvp",
    era: 3,
    demoLocked: true,
    nameKey: "project.p_mvp.name",
    costLoC: big(3e6),
    valueRatio: 1.3,
    buildS: 45,
    kind: "standard",
    rpReward: 2,
    rpFirst: 3
  },
  {
    id: "p_dashboard",
    era: 3,
    demoLocked: true,
    nameKey: "project.p_dashboard.name",
    costLoC: big(2e7),
    valueRatio: 1.1,
    buildS: 50,
    kind: "standard"
  },
  {
    id: "p_enterprise_mig",
    era: 4,
    demoLocked: true,
    nameKey: "project.p_enterprise_mig.name",
    costLoC: big(4e8),
    valueRatio: 1.5,
    buildS: 90,
    kind: "standard"
  },
  {
    id: "p_compliance",
    era: 4,
    demoLocked: true,
    nameKey: "project.p_compliance.name",
    costLoC: big(3e9),
    valueRatio: 1.2,
    buildS: 75,
    kind: "standard",
    bugResistant: true
  },
  {
    id: "p_copilot_clone",
    era: 5,
    demoLocked: true,
    nameKey: "project.p_copilot_clone.name",
    costLoC: big(5e10),
    valueRatio: 1.3,
    buildS: 60,
    kind: "standard",
    hypeBonus: 0.6
  },
  {
    id: "p_cloud_platform",
    era: 5,
    demoLocked: true,
    nameKey: "project.p_cloud_platform.name",
    costLoC: big(4e11),
    valueRatio: 1.4,
    buildS: 100,
    kind: "standard",
    rpReward: 3,
    rpFirst: 3
  },
  {
    id: "p_banking_core",
    era: 6,
    demoLocked: true,
    nameKey: "project.p_banking_core.name",
    costLoC: big(6e12),
    valueRatio: 1.5,
    buildS: 120,
    kind: "standard"
  },
  {
    id: "p_self_driving",
    era: 6,
    demoLocked: true,
    nameKey: "project.p_self_driving.name",
    costLoC: big(5e13),
    valueRatio: 1.2,
    buildS: 90,
    kind: "standard",
    hypeBonus: 0.8
  },
  {
    id: "p_city_os",
    era: 7,
    demoLocked: true,
    nameKey: "project.p_city_os.name",
    costLoC: big(8e14),
    valueRatio: 1.4,
    buildS: 110,
    kind: "standard"
  },
  {
    id: "p_synth_workforce",
    era: 7,
    demoLocked: true,
    nameKey: "project.p_synth_workforce.name",
    costLoC: big(7e15),
    valueRatio: 1.3,
    buildS: 100,
    kind: "standard"
  },
  {
    id: "p_logistics_brain",
    era: 8,
    demoLocked: true,
    nameKey: "project.p_logistics_brain.name",
    costLoC: big(1e17),
    valueRatio: 1.5,
    buildS: 120,
    kind: "standard"
  },
  {
    id: "p_climate_rewrite",
    era: 8,
    demoLocked: true,
    nameKey: "project.p_climate_rewrite.name",
    costLoC: big(9e17),
    valueRatio: 1.2,
    buildS: 100,
    kind: "standard",
    rpReward: 3,
    rpFirst: 3
  },
  {
    id: "p_mind_upload",
    era: 9,
    demoLocked: true,
    nameKey: "project.p_mind_upload.name",
    costLoC: big(1.5e19),
    valueRatio: 1.4,
    buildS: 110,
    kind: "standard",
    hypeBonus: 1
  },
  {
    id: "p_reality_patch",
    era: 9,
    demoLocked: true,
    nameKey: "project.p_reality_patch.name",
    costLoC: big(1.2e20),
    valueRatio: 1.3,
    buildS: 90,
    kind: "standard"
  },
  {
    id: "p_planetary_os",
    era: 10,
    demoLocked: true,
    nameKey: "project.p_planetary_os.name",
    costLoC: big(2e21),
    valueRatio: 1.5,
    buildS: 150,
    kind: "standard"
  },
  {
    id: "p_omega_request",
    era: 10,
    demoLocked: true,
    nameKey: "project.p_omega_request.name",
    costLoC: big(1e20),
    valueRatio: 2,
    buildS: 240,
    kind: "standard",
    unlock: { flag: "omega_requests" }
  },
  {
    id: "p_aurora_seed",
    era: 10,
    demoLocked: true,
    nameKey: "project.p_aurora_seed.name",
    costLoC: big(5e22),
    valueRatio: 0,
    buildS: 300,
    kind: "unlock",
    unlock: { flag: AURORA_SEED_AVAILABLE_FLAG },
    completionEffect: "unlockAurora"
  }
] as const;

type ExpansionProjectSpec = readonly [
  id: string,
  era: number,
  costLoC: string,
  valueRatio: number,
  buildS: number
];

const EXPANSION_PROJECT_SPECS: readonly ExpansionProjectSpec[] = [
  ["p_t1_portfolio_site", 1, "2e3", 0.55, 70],
  ["p_t1_static_docs", 1, "3.5e3", 0.5, 80],
  ["p_t1_bug_tracker", 1, "6e3", 0.62, 100],
  ["p_t1_invoice_helper", 1, "1.1e4", 0.68, 115],
  ["p_t1_markdown_blog", 1, "1.8e4", 0.6, 120],
  ["p_t1_booking_widget", 1, "2.8e4", 0.72, 135],
  ["p_t1_local_crm", 1, "4.2e4", 0.74, 150],
  ["p_t1_support_macros", 1, "6e4", 0.64, 155],
  ["p_t2_creator_store", 2, "2.2e5", 0.78, 90],
  ["p_t2_ai_notes", 2, "3.4e5", 0.82, 95],
  ["p_t2_team_dashboard", 2, "5.2e5", 0.86, 105],
  ["p_t2_subscription_portal", 2, "8e5", 0.9, 115],
  ["p_t2_lightweight_lms", 2, "1.2e6", 0.8, 125],
  ["p_t2_webhook_router", 2, "1.8e6", 0.88, 135],
  ["p_t2_analytics_clipboard", 2, "2.6e6", 0.92, 145],
  ["p_t2_no_code_form_builder", 2, "3.7e6", 0.94, 155],
  ["p_t3_ai_helpdesk", 3, "5.5e6", 1.05, 55],
  ["p_t3_payments_recon", 3, "8e6", 1.08, 60],
  ["p_t3_multi_tenant_admin", 3, "1.2e7", 1.12, 65],
  ["p_t3_realtime_whiteboard", 3, "1.8e7", 1.16, 70],
  ["p_t3_customer_health", 3, "2.7e7", 1.1, 75],
  ["p_t3_sales_ops_bot", 3, "4e7", 1.18, 80],
  ["p_t3_embeddings_wiki", 3, "5.8e7", 1.22, 85],
  ["p_t3_mobile_companion", 3, "8.5e7", 1.14, 90],
  ["p_t4_sla_monitor", 4, "1.2e9", 1.24, 85],
  ["p_t4_enterprise_sso", 4, "1.8e9", 1.28, 90],
  ["p_t4_data_warehouse", 4, "2.7e9", 1.32, 95],
  ["p_t4_support_automation", 4, "4e9", 1.2, 100],
  ["p_t4_canary_release_console", 4, "6e9", 1.26, 110],
  ["p_t4_audit_evidence_vault", 4, "9e9", 1.34, 120],
  ["p_t4_partner_api_hub", 4, "1.35e10", 1.3, 130],
  ["p_t4_churn_prediction", 4, "2e10", 1.24, 140],
  ["p_t5_agent_marketplace", 5, "7e10", 1.36, 70],
  ["p_t5_model_eval_lab", 5, "1.1e11", 1.42, 75],
  ["p_t5_security_scan_cloud", 5, "1.7e11", 1.38, 80],
  ["p_t5_feature_flag_mesh", 5, "2.6e11", 1.34, 85],
  ["p_t5_enterprise_rfp_portal", 5, "4e11", 1.46, 95],
  ["p_t5_ai_observability", 5, "6e11", 1.44, 105],
  ["p_t5_support_load_balancer", 5, "9e11", 1.32, 115],
  ["p_t5_privacy_review_bot", 5, "1.3e12", 1.4, 125],
  ["p_t6_regulated_fintech_core", 6, "7e12", 1.52, 115],
  ["p_t6_healthcare_workflow_os", 6, "1.1e13", 1.48, 120],
  ["p_t6_distributed_job_runner", 6, "1.7e13", 1.5, 125],
  ["p_t6_incident_command_center", 6, "2.5e13", 1.44, 130],
  ["p_t6_agent_memory_fabric", 6, "3.8e13", 1.56, 135],
  ["p_t6_compliance_copilot", 6, "5.7e13", 1.5, 145],
  ["p_t6_legacy_migration_ai", 6, "8.5e13", 1.58, 155],
  ["p_t6_multi_region_control", 6, "1.3e14", 1.54, 165],
  ["p_t7_autonomous_saas_factory", 7, "1.1e15", 1.64, 120],
  ["p_t7_global_support_ai", 7, "1.7e15", 1.58, 125],
  ["p_t7_synthetic_user_lab", 7, "2.6e15", 1.62, 130],
  ["p_t7_enterprise_trust_graph", 7, "4e15", 1.68, 135],
  ["p_t7_self_healing_cloud", 7, "6e15", 1.66, 145],
  ["p_t7_agent_swarm_console", 7, "9e15", 1.72, 155],
  ["p_t7_model_routing_exchange", 7, "1.35e16", 1.6, 165],
  ["p_t7_zero_downtime_migration", 7, "2e16", 1.7, 175],
  ["p_t8_planetary_erp", 8, "1.4e17", 1.78, 130],
  ["p_t8_climate_data_mesh", 8, "2.1e17", 1.72, 135],
  ["p_t8_ai_regulation_engine", 8, "3.2e17", 1.82, 145],
  ["p_t8_global_logistics_kernel", 8, "4.8e17", 1.76, 155],
  ["p_t8_autonomous_dev_market", 8, "7.2e17", 1.84, 165],
  ["p_t8_privacy_preserving_model_net", 8, "1.1e18", 1.8, 175],
  ["p_t8_disaster_response_os", 8, "1.6e18", 1.74, 185],
  ["p_t8_memory_safe_rewrite_grid", 8, "2.4e18", 1.86, 195],
  ["p_t9_mind_archive", 9, "2e19", 1.9, 135],
  ["p_t9_reality_test_harness", 9, "3e19", 1.96, 145],
  ["p_t9_civilization_ci", 9, "4.5e19", 1.92, 155],
  ["p_t9_autonomous_court_system", 9, "6.8e19", 1.88, 165],
  ["p_t9_human_agent_treaty", 9, "1e20", 1.98, 175],
  ["p_t9_model_constitution", 9, "1.5e20", 1.94, 185],
  ["p_t9_postscarcity_billing", 9, "2.2e20", 1.9, 195],
  ["p_t10_paradox_release_train", 10, "3e21", 2.05, 160],
  ["p_t10_omega_ops_center", 10, "4.5e21", 2.1, 170],
  ["p_t10_recursive_product_forge", 10, "6.8e21", 2.02, 180],
  ["p_t10_universal_rollback", 10, "1e22", 2.08, 190],
  ["p_t10_legacy_of_every_run", 10, "1.5e22", 2.12, 210],
  ["p_t10_empire_observatory", 10, "2.2e22", 2.06, 230],
  ["p_t10_autonomous_empire_index", 10, "3.4e22", 2.14, 250]
] as const;

const EXPANSION_PROJECTS: readonly ProjectDefinition[] = EXPANSION_PROJECT_SPECS.map(
  ([id, era, costLoC, valueRatio, buildS], index): ProjectDefinition => ({
    id,
    era,
    demoLocked: era >= 3,
    nameKey: `project.${id}.name`,
    costLoC: big(costLoC),
    valueRatio,
    buildS,
    kind: "standard",
    unlock: { flag: "iteration_unlocked" },
    hypeBonus: index % 4 === 0 ? 0.4 + era * 0.05 : undefined,
    rpReward: index % 6 === 0 ? Math.max(1, Math.floor(era / 2)) : undefined,
    rpFirst: index % 6 === 0 ? 2 : undefined,
    bugResistant: index % 9 === 0 ? true : undefined
  })
);

export const PROJECTS: readonly ProjectDefinition[] = [...CORE_PROJECTS, ...EXPANSION_PROJECTS];

export const REFACTOR_PROJECT: ProjectDefinition = {
  id: "p_refactor",
  era: 1,
  nameKey: "project.p_refactor.name",
  costLoC: big(0),
  valueRatio: 0,
  buildS: 30,
  kind: "refactor"
};
