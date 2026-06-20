export type BleepKind = "click" | "error" | "message" | "ship" | "unlock";

export interface AudioSettings {
  readonly sound: boolean;
  readonly volume: number;
}

export interface AudioController {
  play(kind: BleepKind): void;
  setSettings(settings: AudioSettings): void;
}

const oscillatorTypes = {
  click: "sine",
  error: "square",
  message: "sawtooth",
  ship: "triangle",
  unlock: "square"
} satisfies Record<BleepKind, OscillatorType>;

type AudioContextConstructor = new () => AudioContext;
type AudioWindow = Window & {
  readonly AudioContext?: AudioContextConstructor;
  readonly webkitAudioContext?: AudioContextConstructor;
};

export function createAudioController(initialSettings: AudioSettings): AudioController {
  let enabled = initialSettings.sound;
  let volume = clampVolume(initialSettings.volume);
  let context: AudioContext | undefined;
  let master: GainNode | undefined;

  function ensureContext(): AudioContext | undefined {
    if (context !== undefined) {
      return context;
    }

    const audioWindow = getAudioWindow();
    const Context = audioWindow?.AudioContext ?? audioWindow?.webkitAudioContext;

    if (Context === undefined) {
      return undefined;
    }

    try {
      const nextContext = new Context();
      context = nextContext;
      master = nextContext.createGain();
      master.gain.value = volume;
      master.connect(nextContext.destination);
      return nextContext;
    } catch {
      return undefined;
    }
  }

  return {
    play(kind): void {
      if (!enabled || volume <= 0) {
        return;
      }

      const audio = ensureContext();

      if (audio === undefined || master === undefined) {
        return;
      }

      void audio.resume();

      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = oscillatorTypes[kind];
      gain.gain.value = 1;
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start();

      const audioWindow = getAudioWindow();
      const requestFrame =
        audioWindow?.requestAnimationFrame?.bind(audioWindow) ??
        ((callback: FrameRequestCallback): number => {
          callback(0);
          return 0;
        });

      requestFrame(() => {
        oscillator.stop();
        oscillator.disconnect();
        gain.disconnect();
      });
    },

    setSettings(settings): void {
      enabled = settings.sound;
      volume = clampVolume(settings.volume);

      if (master !== undefined) {
        master.gain.value = volume;
      }
    }
  };
}

function getAudioWindow(): AudioWindow | undefined {
  return typeof window === "undefined" ? undefined : (window as AudioWindow);
}

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}
