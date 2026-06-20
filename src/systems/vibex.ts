import { nextRandomIndex } from "../core/rng";
import { VIBEX_CANNED_PAIRS, VIBEX_CODE_FILES } from "../data/vibex";

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

export function createVibexCodeState(): VibexCodeState {
  return {
    fileIndex: 0,
    fragmentIndex: -1,
    sequence: 0
  };
}

export function advanceVibexCode(state: VibexCodeState): VibexCodeFrame {
  const files = VIBEX_CODE_FILES;
  let committed = false;
  let nextFileIndex = state.fileIndex;
  let nextFragmentIndex = state.fragmentIndex + 1;
  const currentFile = files[nextFileIndex]!;

  if (nextFragmentIndex >= currentFile.fragments.length) {
    nextFragmentIndex = 0;
    nextFileIndex = (nextFileIndex + 1) % files.length;
    committed = nextFileIndex === 0;
  }

  state.fileIndex = nextFileIndex;
  state.fragmentIndex = nextFragmentIndex;
  state.sequence += 1;

  return getVibexCodeFrame(state, committed);
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
