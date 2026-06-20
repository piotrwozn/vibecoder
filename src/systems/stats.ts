import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import type { DerivedCache } from "./production";

export const LOC_RATE_SAMPLE_INTERVAL_S = 30;
export const LOC_RATE_SAMPLE_WINDOW_S = 60 * 60;
export const LOC_RATE_SAMPLE_CAPACITY = LOC_RATE_SAMPLE_WINDOW_S / LOC_RATE_SAMPLE_INTERVAL_S;

const LOC_RATE_SAMPLE_PREFIX = "stats.locRate.sample.";
const LOC_RATE_SAMPLE_COUNT_STAT = "stats.locRate.sampleCount";
const LOC_RATE_SAMPLE_INDEX_STAT = "stats.locRate.sampleIndex";
const LOC_RATE_SAMPLE_LAST_AT_STAT = "stats.locRate.lastSampleAt";

export function tickStats(state: GameState, cache: Pick<DerivedCache, "locRate">): boolean {
  const lastSampleAt = getNumericStat(state, LOC_RATE_SAMPLE_LAST_AT_STAT);

  if (state.meta.playtimeS < lastSampleAt + LOC_RATE_SAMPLE_INTERVAL_S) {
    return false;
  }

  const count = Math.min(
    getNumericStat(state, LOC_RATE_SAMPLE_COUNT_STAT),
    LOC_RATE_SAMPLE_CAPACITY
  );
  const lastIndex = getNumericStat(state, LOC_RATE_SAMPLE_INDEX_STAT);
  const nextIndex = count === 0 ? 0 : (lastIndex + 1) % LOC_RATE_SAMPLE_CAPACITY;

  state.stats[getLocRateSampleKey(nextIndex)] = cache.locRate.copy();
  state.stats[LOC_RATE_SAMPLE_COUNT_STAT] = Math.min(count + 1, LOC_RATE_SAMPLE_CAPACITY);
  state.stats[LOC_RATE_SAMPLE_INDEX_STAT] = nextIndex;
  state.stats[LOC_RATE_SAMPLE_LAST_AT_STAT] = state.meta.playtimeS;

  return true;
}

export function getLocRateSamples(state: GameState): readonly Big[] {
  const count = Math.min(
    getNumericStat(state, LOC_RATE_SAMPLE_COUNT_STAT),
    LOC_RATE_SAMPLE_CAPACITY
  );
  const lastIndex = getNumericStat(state, LOC_RATE_SAMPLE_INDEX_STAT);
  const samples: Big[] = [];

  for (let offset = 0; offset < count; offset += 1) {
    const index =
      count < LOC_RATE_SAMPLE_CAPACITY
        ? offset
        : (lastIndex + 1 + offset) % LOC_RATE_SAMPLE_CAPACITY;
    const sample = state.stats[getLocRateSampleKey(index)];
    samples.push(sample instanceof Big ? sample : Big.zero());
  }

  return samples;
}

function getLocRateSampleKey(index: number): string {
  return `${LOC_RATE_SAMPLE_PREFIX}${index}`;
}

function getNumericStat(state: GameState, key: string): number {
  const value = state.stats[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
