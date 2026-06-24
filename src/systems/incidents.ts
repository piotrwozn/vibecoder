import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import { nextRandom } from "../core/rng";
import type {
  GameState,
  IncidentResponseId,
  ProductionIncident,
  ProductionIncidentType
} from "../core/state";
import { BUILD_MOMENTUM } from "../data/momentum";
import {
  PRODUCTION_INCIDENTS,
  getIncidentDefinition,
  getIncidentResponse
} from "../data/incidents";
import { checkCondition } from "./unlocks";
import type { DerivedCache } from "./production";
import { addBuildMomentum } from "./momentum";
import { canSpendBig, canSpendNumber, spendBig, spendNumber } from "./resources";

const INCIDENT_CHECK_INTERVAL_S = 90;
const MAX_ACTIVE_INCIDENTS = 2;
const MAX_INCIDENT_HISTORY = 50;
const INCIDENT_ID_PREFIX = "incident";

export interface IncidentEffects {
  readonly auroraBillingMultiplier: number;
  readonly bugChanceMultiplier: number;
  readonly debtFactorMultiplier: number;
  readonly hypeMultiplier: number;
  readonly revenueMultiplier: number;
}

export interface ResolveIncidentResult {
  readonly id: string;
  readonly ok: boolean;
  readonly reason?:
    | "insufficient-loc"
    | "insufficient-money"
    | "insufficient-rp"
    | "invalid-response"
    | "missing";
  readonly response: IncidentResponseId;
}

export function tickProductionIncidents(state: GameState, bus?: EventBus): boolean {
  let changed = resolveExpiredIncidents(state, bus);

  if (state.meta.playtimeS < state.incidents.nextCheckAtS) {
    return changed;
  }

  state.incidents.nextCheckAtS = state.meta.playtimeS + INCIDENT_CHECK_INTERVAL_S;
  changed = trySpawnIncident(state, bus) || changed;
  return changed;
}

export function trySpawnIncident(state: GameState, bus?: EventBus): boolean {
  if (state.incidents.active.length >= MAX_ACTIVE_INCIDENTS) {
    return false;
  }

  const candidates = PRODUCTION_INCIDENTS.filter(
    (incident) =>
      checkCondition(state, incident.trigger) &&
      !state.incidents.active.some((active) => active.type === incident.id)
  );

  if (candidates.length === 0) {
    return false;
  }

  for (const candidate of candidates) {
    const roll = nextRandom(state.rngSeed);
    state.rngSeed = roll.seed;

    if (roll.value > getIncidentChance(state, candidate.id, candidate.baseChance)) {
      continue;
    }

    const incident = createIncident(state, candidate.id);
    state.incidents.active.push(incident);
    state.stats[`incident.${candidate.id}.spawned`] =
      getNumericStat(state, `incident.${candidate.id}.spawned`) + 1;
    bus?.emit("incident:spawned", { id: incident.id, type: incident.type });
    return true;
  }

  return false;
}

export function resolveProductionIncident(
  state: GameState,
  cache: DerivedCache,
  id: string,
  response: IncidentResponseId,
  bus?: EventBus
): ResolveIncidentResult {
  const incident = state.incidents.active.find((entry) => entry.id === id);

  if (incident === undefined) {
    return { id, ok: false, response, reason: "missing" };
  }

  const definition = getIncidentDefinition(incident.type);
  if (definition === undefined || !definition.responses.includes(response)) {
    return { id, ok: false, response, reason: "invalid-response" };
  }

  const cost = calculateIncidentResponseCost(state, cache, incident, response);

  if (!canSpendBig(state.res.loc, cost.loc)) {
    return { id, ok: false, response, reason: "insufficient-loc" };
  }

  if (!canSpendBig(state.res.money, cost.money)) {
    return { id, ok: false, response, reason: "insufficient-money" };
  }

  if (!canSpendNumber(state.res.rp, cost.rp)) {
    return { id, ok: false, response, reason: "insufficient-rp" };
  }

  spendBig(state.res.loc, cost.loc);
  spendBig(state.res.money, cost.money);
  state.res.rp = spendNumber(state.res.rp, cost.rp) ?? state.res.rp;
  applyIncidentResponseEffect(state, incident, response);
  completeIncident(state, incident, response, bus);
  addBuildMomentum(state, getIncidentMomentumDelta(incident.severity, response), bus);
  return { id, ok: true, response };
}

export function calculateIncidentResponseCost(
  state: GameState,
  cache: DerivedCache,
  incident: ProductionIncident,
  response: IncidentResponseId
): { readonly loc: Big; readonly money: Big; readonly rp: number } {
  const definition = getIncidentResponse(response);
  const severity = Math.max(1, incident.severity);
  const loc = Big.mul(cache.locRate, Big.fromNumber((definition?.costLocS ?? 0) * severity));
  const income = Big.mul(cache.locRate, Big.fromNumber(30));
  const money = Big.mul(
    Big.max(state.res.money, income),
    Big.fromNumber((definition?.costMoneyRatio ?? 0) * severity)
  );
  return {
    loc,
    money,
    rp: (definition?.costRp ?? 0) * severity
  };
}

export function getIncidentEffects(state: GameState): IncidentEffects {
  const activeSeverity = state.incidents.active.reduce(
    (sum, incident) => sum + incident.severity,
    0
  );

  if (activeSeverity <= 0) {
    return {
      auroraBillingMultiplier: 1,
      bugChanceMultiplier: 1,
      debtFactorMultiplier: 1,
      hypeMultiplier: 1,
      revenueMultiplier: 1
    };
  }

  return {
    auroraBillingMultiplier: 1 + activeSeverity * 0.15,
    bugChanceMultiplier: 1 + activeSeverity * 0.35,
    debtFactorMultiplier: 1 + activeSeverity * 0.22,
    hypeMultiplier: Math.max(0.15, 1 - activeSeverity * 0.14),
    revenueMultiplier: Math.max(0.05, 1 - activeSeverity * 0.28)
  };
}

export function hasActiveProductionIncident(state: GameState): boolean {
  return state.incidents.active.length > 0;
}

function resolveExpiredIncidents(state: GameState, bus?: EventBus): boolean {
  let changed = false;

  for (const incident of [...state.incidents.active]) {
    if (state.meta.playtimeS < incident.untilS) {
      continue;
    }

    applyIncidentResponseEffect(state, incident, "accept_debt");
    Big.addIn(state.res.debt, getIncidentTimeoutDebtPenalty(incident));
    completeIncident(state, incident, "accept_debt", bus);
    addBuildMomentum(state, getIncidentMomentumDelta(incident.severity, "accept_debt"), bus);
    changed = true;
  }

  return changed;
}

function getIncidentTimeoutDebtPenalty(incident: ProductionIncident): Big {
  return Big.fromNumber(incident.severity * 600);
}

function getIncidentChance(
  state: GameState,
  type: ProductionIncidentType,
  baseChance: number
): number {
  let chance = baseChance;

  if (state.roadmap.active === "stability") {
    chance *= 0.6;
  }

  if (state.metaprogression.runStyle === "cursed_enterprise") {
    chance *= 1.6;
  }

  if (state.metaprogression.runStyle === "aurora_first" && type.startsWith("aurora")) {
    chance *= 1.5;
  }

  if (state.story.flags.has("decision.quality") || state.story.flags.has("decision.privacy")) {
    chance *= 0.8;
  }

  if (state.story.flags.has("decision.ship_fast") || state.story.flags.has("decision.growth")) {
    chance *= 1.25;
  }

  chance *= 1.25;

  return Math.min(0.85, Math.max(0, chance));
}

function createIncident(state: GameState, type: ProductionIncidentType): ProductionIncident {
  const definition = getIncidentDefinition(type);
  const ordinal = getNumericStat(state, "incidents.spawned") + 1;
  state.stats["incidents.spawned"] = ordinal;

  return {
    id: `${INCIDENT_ID_PREFIX}.${ordinal}`,
    severity: definition?.severity ?? 1,
    startedAtS: state.meta.playtimeS,
    type,
    untilS: state.meta.playtimeS + (definition?.durationS ?? INCIDENT_CHECK_INTERVAL_S)
  };
}

function applyIncidentResponseEffect(
  state: GameState,
  incident: ProductionIncident,
  response: IncidentResponseId
): void {
  const definition = getIncidentResponse(response);
  const debtMultiplier = definition?.debtMultiplier ?? 1;

  if (debtMultiplier !== 1) {
    Big.mulIn(state.res.debt, Big.fromNumber(debtMultiplier));
  }

  if (response === "accept_debt") {
    Big.addIn(state.res.debt, Big.fromNumber(incident.severity * 700));
  }

  if (definition?.hypeDelta !== undefined) {
    state.res.hype = Math.max(1, state.res.hype + definition.hypeDelta);
  }
}

function completeIncident(
  state: GameState,
  incident: ProductionIncident,
  response: IncidentResponseId,
  bus?: EventBus
): void {
  state.incidents.active = state.incidents.active.filter((entry) => entry.id !== incident.id);
  state.incidents.history.push({
    id: incident.id,
    response,
    resolvedAtS: state.meta.playtimeS,
    severity: incident.severity,
    startedAtS: incident.startedAtS,
    type: incident.type
  });
  if (state.incidents.history.length > MAX_INCIDENT_HISTORY) {
    state.incidents.history.splice(0, state.incidents.history.length - MAX_INCIDENT_HISTORY);
  }
  state.stats[`incident.${incident.type}.resolved`] =
    getNumericStat(state, `incident.${incident.type}.resolved`) + 1;
  bus?.emit("incident:resolved", { id: incident.id, response, type: incident.type });
}

function getIncidentMomentumDelta(severity: number, response: IncidentResponseId): number {
  const normalizedSeverity = Math.max(1, severity);

  if (response === "accept_debt") {
    return BUILD_MOMENTUM.GAINS.INCIDENT_ACCEPT_DEBT * normalizedSeverity;
  }

  return BUILD_MOMENTUM.GAINS.INCIDENT_RESOLVED * normalizedSeverity;
}

function getNumericStat(state: GameState, key: string): number {
  const value = state.stats[key];
  return typeof value === "number" ? value : 0;
}
