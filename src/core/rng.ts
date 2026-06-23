export interface RandomResult {
  readonly seed: number;
  readonly value: number;
}

export function nextRandom(seed: number): RandomResult {
  const nextSeed = (seed + 0x6d2b79f5) | 0;
  let value = Math.imul(nextSeed ^ (nextSeed >>> 15), nextSeed | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

  return {
    seed: nextSeed,
    value: ((value ^ (value >>> 14)) >>> 0) / 4294967296
  };
}

export function nextRandomIndex(
  seed: number,
  length: number
): RandomResult & { readonly index: number } {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("length must be a positive integer");
  }

  const result = nextRandom(seed);
  return {
    ...result,
    index: Math.min(length - 1, Math.floor(result.value * length))
  };
}

export function deriveSeed(seed: number, salt: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < salt.length; index += 1) {
    hash = Math.imul(hash ^ salt.charCodeAt(index), 0x01000193);
  }

  return (seed ^ hash) | 0;
}
