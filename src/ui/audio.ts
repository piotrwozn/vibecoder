import clickUrl from "../assets/audio/ui-click.ogg";
import errorUrl from "../assets/audio/ui-error.ogg";
import messageUrl from "../assets/audio/ui-message.ogg";
import musicUrl from "../assets/audio/music-out-there.ogg";
import shipUrl from "../assets/audio/ui-ship.ogg";
import unlockUrl from "../assets/audio/ui-unlock.ogg";

export type BleepKind = "boot" | "click" | "error" | "message" | "ship" | "unlock";

export interface AudioSettings {
  readonly sound: boolean;
  readonly volume: number;
}

export interface AudioController {
  play(kind: BleepKind): void;
  setSettings(settings: AudioSettings): void;
}

const oscillatorTypes = {
  boot: "triangle",
  click: "sine",
  error: "square",
  message: "sawtooth",
  ship: "triangle",
  unlock: "square"
} satisfies Record<BleepKind, OscillatorType>;

const sampleUrls = {
  boot: unlockUrl,
  click: clickUrl,
  error: errorUrl,
  message: messageUrl,
  ship: shipUrl,
  unlock: unlockUrl
} satisfies Record<BleepKind, string>;

type AudioContextConstructor = new () => AudioContext;
type HtmlAudioConstructor = new (url?: string) => HTMLAudioElement;
type AudioWindow = Window & {
  readonly Audio?: HtmlAudioConstructor;
  readonly AudioContext?: AudioContextConstructor;
  readonly webkitAudioContext?: AudioContextConstructor;
};

export function createAudioController(initialSettings: AudioSettings): AudioController {
  let enabled = initialSettings.sound;
  let volume = clampVolume(initialSettings.volume);
  const activeSamples = new Set<HTMLAudioElement>();
  let context: AudioContext | undefined;
  let master: GainNode | undefined;
  let music: HTMLAudioElement | undefined;
  let musicFallback: MusicFallback | undefined;
  let userGestureSeen = hasUserGesture();

  if (!userGestureSeen) {
    installUserGestureListeners(() => {
      userGestureSeen = true;
    });
  }

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

      if (!userGestureSeen) {
        return;
      }

      const audio = ensureContext();
      if (audio !== undefined) {
        void audio.resume();
      }

      startMusic();
      if (
        playSample(kind, () => {
          playOscillator(kind);
        })
      ) {
        return;
      }

      playOscillator(kind);
    },

    setSettings(settings): void {
      enabled = settings.sound;
      volume = clampVolume(settings.volume);

      if (master !== undefined) {
        master.gain.value = volume;
      }

      if (music !== undefined) {
        music.volume = getMusicVolume(volume);
        if (!enabled || volume <= 0) {
          music.pause();
        }
      }

      for (const sample of activeSamples) {
        sample.volume = volume;
        if (!enabled || volume <= 0) {
          sample.pause();
        }
      }

      if (!enabled || volume <= 0) {
        stopMusicFallback();
      } else {
        updateMusicFallbackVolume();
      }
    }
  };

  function playOscillator(kind: BleepKind): void {
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
  }

  function playSample(kind: BleepKind, onFail: () => void): boolean {
    const AudioCtor = getAudioWindow()?.Audio;

    if (AudioCtor === undefined) {
      return false;
    }

    try {
      const sample = new AudioCtor(sampleUrls[kind]);
      sample.preload = "auto";
      sample.volume = volume;

      if (!canPlayOgg(sample)) {
        onFail();
        return true;
      }

      activeSamples.add(sample);
      addAudioListener(sample, "ended", () => {
        activeSamples.delete(sample);
      });
      addAudioListener(sample, "error", () => {
        activeSamples.delete(sample);
        onFail();
      });

      const started = sample.play();
      void started.catch(() => {
        activeSamples.delete(sample);
        onFail();
      });

      return true;
    } catch {
      return false;
    }
  }

  function startMusic(): void {
    const AudioCtor = getAudioWindow()?.Audio;

    if (AudioCtor === undefined) {
      startMusicFallback();
      return;
    }

    try {
      music ??= new AudioCtor(musicUrl);
      music.loop = true;
      music.preload = "auto";
      music.volume = getMusicVolume(volume);

      if (!canPlayOgg(music)) {
        startMusicFallback();
        return;
      }

      if (music.paused) {
        void music
          .play()
          .then(() => {
            stopMusicFallback();
          })
          .catch(() => {
            startMusicFallback();
          });
      }
    } catch {
      music = undefined;
      startMusicFallback();
    }
  }

  function startMusicFallback(): void {
    if (!enabled || volume <= 0 || musicFallback !== undefined) {
      return;
    }

    const audio = ensureContext();

    if (audio === undefined || master === undefined) {
      return;
    }

    const low = audio.createOscillator();
    const high = audio.createOscillator();
    const gain = audio.createGain();
    low.type = "sine";
    high.type = "triangle";
    low.frequency.value = 110;
    high.frequency.value = 164.81;
    gain.gain.value = getFallbackMusicGain(volume);
    low.connect(gain);
    high.connect(gain);
    gain.connect(master);
    low.start();
    high.start();
    musicFallback = { gain, oscillators: [low, high] };
  }

  function stopMusicFallback(): void {
    if (musicFallback === undefined) {
      return;
    }

    for (const oscillator of musicFallback.oscillators) {
      oscillator.stop();
      oscillator.disconnect();
    }

    musicFallback.gain.disconnect();
    musicFallback = undefined;
  }

  function updateMusicFallbackVolume(): void {
    if (musicFallback !== undefined) {
      musicFallback.gain.gain.value = getFallbackMusicGain(volume);
    }
  }
}

interface MusicFallback {
  readonly gain: GainNode;
  readonly oscillators: readonly OscillatorNode[];
}

function addAudioListener(
  audio: HTMLAudioElement,
  event: "ended" | "error",
  listener: () => void
): void {
  const addEventListener = (
    audio as HTMLAudioElement & {
      readonly addEventListener?: (
        event: "ended" | "error",
        listener: () => void,
        options?: AddEventListenerOptions
      ) => void;
    }
  ).addEventListener;

  addEventListener?.call(audio, event, listener, { once: true });
}

function canPlayOgg(audio: HTMLAudioElement): boolean {
  const canPlayType = (
    audio as HTMLAudioElement & {
      readonly canPlayType?: (type: string) => CanPlayTypeResult;
    }
  ).canPlayType;

  if (canPlayType === undefined) {
    return true;
  }

  return canPlayType.call(audio, "audio/ogg; codecs=vorbis") !== "";
}

function getAudioWindow(): AudioWindow | undefined {
  return typeof window === "undefined" ? undefined : (window as AudioWindow);
}

function hasUserGesture(): boolean {
  const audioWindow = getAudioWindow();

  if (audioWindow?.document === undefined) {
    return true;
  }

  const userActivation = audioWindow.navigator.userActivation;
  return userActivation?.hasBeenActive === true;
}

function installUserGestureListeners(onGesture: () => void): void {
  const audioWindow = getAudioWindow();
  const document = audioWindow?.document;

  if (document === undefined) {
    return;
  }

  const activate = (): void => {
    onGesture();
    document.removeEventListener("keydown", activate, true);
    document.removeEventListener("pointerdown", activate, true);
    document.removeEventListener("touchstart", activate, true);
  };

  document.addEventListener("keydown", activate, true);
  document.addEventListener("pointerdown", activate, true);
  document.addEventListener("touchstart", activate, true);
}

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function getMusicVolume(volume: number): number {
  return Math.min(0.22, volume * 0.45);
}

function getFallbackMusicGain(volume: number): number {
  return Math.min(0.08, volume * 0.18);
}
