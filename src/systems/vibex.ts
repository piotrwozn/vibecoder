import { nextRandomIndex } from "../core/rng";
import {
  VIBEX_CANNED_PAIRS,
  VIBEX_CODE_FILES,
  VIBEX_FILE_LABEL_KEYS,
  VIBEX_MANUAL_FALLBACK_KEYS
} from "../data/vibex";

const VIBEX_SENDS_PER_COMMIT = 10;

export interface VibexCannedBag {
  lastId: string | undefined;
  remainingIds: string[];
  seed: number;
}

export interface VibexCannedDraw {
  readonly promptKey: string;
  readonly responseKey: string;
}

export interface VibexCodeState {
  fileIndex: number;
  fragmentIndex: number;
  seed: number;
  sequence: number;
}

export interface VibexCodeFrame {
  readonly committed: boolean;
  readonly fileId: string;
  readonly lineKeys: readonly string[];
  readonly sequence: number;
}

export function createVibexCannedBag(seed = 1): VibexCannedBag {
  return {
    lastId: undefined,
    remainingIds: [],
    seed
  };
}

export function drawVibexCannedPair(bag: VibexCannedBag): VibexCannedDraw {
  if (bag.remainingIds.length === 0) {
    bag.remainingIds = VIBEX_CANNED_PAIRS.map((pair) => pair.id);
  }

  let random = nextRandomIndex(bag.seed, bag.remainingIds.length);
  bag.seed = random.seed;

  if (bag.remainingIds.length > 1 && bag.remainingIds[random.index] === bag.lastId) {
    random = {
      ...random,
      index: (random.index + 1) % bag.remainingIds.length
    };
  }

  const id = bag.remainingIds.splice(random.index, 1)[0]!;
  bag.lastId = id;

  const pair = VIBEX_CANNED_PAIRS.find((entry) => entry.id === id);
  if (pair === undefined) {
    throw new Error(`Unknown Vibex canned pair: ${id}`);
  }

  return {
    promptKey: pair.promptKey,
    responseKey: pair.responseKey
  };
}

export function createVibexCodeState(seed = 1): VibexCodeState {
  return {
    fileIndex: 0,
    fragmentIndex: -1,
    seed,
    sequence: 0
  };
}

export function advanceVibexCode(state: VibexCodeState): VibexCodeFrame {
  const files = VIBEX_CODE_FILES;
  let fileRandom = nextRandomIndex(state.seed, files.length);
  state.seed = fileRandom.seed;

  if (files.length > 1 && fileRandom.index === state.fileIndex) {
    fileRandom = {
      ...fileRandom,
      index: (fileRandom.index + 1) % files.length
    };
  }

  const file = files[fileRandom.index]!;
  const fragmentRandom = nextRandomIndex(state.seed, file.fragments.length);
  state.seed = fragmentRandom.seed;
  const nextSequence = state.sequence + 1;

  state.fileIndex = fileRandom.index;
  state.fragmentIndex = fragmentRandom.index;
  state.sequence = nextSequence;

  return getVibexCodeFrame(state, nextSequence % VIBEX_SENDS_PER_COMMIT === 0);
}

export function getVibexCodeFrame(state: VibexCodeState, committed = false): VibexCodeFrame {
  const file = VIBEX_CODE_FILES[state.fileIndex]!;
  const fragment = file.fragments[Math.max(0, state.fragmentIndex)] ?? file.fragments[0]!;

  return {
    committed,
    fileId: file.id,
    lineKeys: fragment.lineKeys,
    sequence: state.sequence
  };
}

export function getVibexFileIds(): readonly string[] {
  return VIBEX_CODE_FILES.map((file) => file.id);
}

export function getVibexFileLabelKey(state: VibexCodeState, fileIndex: number): string {
  const batch = Math.floor(state.sequence / VIBEX_SENDS_PER_COMMIT);
  const labelIndex = (batch * VIBEX_CODE_FILES.length + fileIndex) % VIBEX_FILE_LABEL_KEYS.length;
  return VIBEX_FILE_LABEL_KEYS[labelIndex]!;
}

export function getVibexManualFallbackKey(sequence: number): string {
  return VIBEX_MANUAL_FALLBACK_KEYS[sequence % VIBEX_MANUAL_FALLBACK_KEYS.length]!;
}
