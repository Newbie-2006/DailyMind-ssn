/**
 * The browser's own speech: recognition to hear the person, synthesis to
 * answer aloud. No audio leaves the device through DailyMind; Chrome's
 * recognition does use Google's speech service.
 *
 * Recognition is Chrome/Edge/Samsung Internet only, and does not work inside
 * the Capacitor Android WebView. Gary falls back to typing where it is missing.
 */

/** The parts of the Web Speech API this file uses. Typed here, because the DOM lib does not ship them. */
interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  0: RecognitionAlternative;
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface RecognitionErrorEvent {
  error: string;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function canListen(): boolean {
  return recognitionConstructor() !== null;
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export type ListenFailure = 'denied' | 'no_speech' | 'network' | 'unsupported' | 'aborted';

export class ListenError extends Error {
  reason: ListenFailure;

  constructor(reason: ListenFailure) {
    super(reason);
    this.name = 'ListenError';
    this.reason = reason;
  }
}

export interface ListenHandle {
  /** Resolves with the final words, or rejects with a ListenError. */
  result: Promise<string>;
  /** Ends listening early and keeps what was heard. */
  stop(): void;
  /** Ends listening and throws away what was heard. */
  cancel(): void;
}

/** Listens for a single utterance. `onInterim` shows words as they arrive. */
export function listen(locale: string, onInterim: (text: string) => void): ListenHandle {
  const Constructor = recognitionConstructor();
  if (!Constructor) {
    return {
      result: Promise.reject(new ListenError('unsupported')),
      stop: () => {},
      cancel: () => {},
    };
  }

  const recognition = new Constructor();
  recognition.lang = locale;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  let finalText = '';
  let failure: ListenFailure | null = null;
  let cancelled = false;

  const result = new Promise<string>((resolve, reject) => {
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i];
        if (piece.isFinal) finalText += piece[0].transcript;
        else interim += piece[0].transcript;
      }
      onInterim(`${finalText} ${interim}`.trim());
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') failure = 'denied';
      else if (event.error === 'no-speech') failure = 'no_speech';
      else if (event.error === 'network') failure = 'network';
      else if (event.error === 'aborted') failure = 'aborted';
      else failure = 'no_speech';
    };

    recognition.onend = () => {
      if (cancelled) reject(new ListenError('aborted'));
      else if (finalText.trim()) resolve(finalText.trim());
      else reject(new ListenError(failure ?? 'no_speech'));
    };
  });

  try {
    recognition.start();
  } catch {
    // start() throws if a previous session is still closing.
    return { result: Promise.reject(new ListenError('aborted')), stop: () => {}, cancel: () => {} };
  }

  return {
    result,
    stop: () => recognition.stop(),
    cancel: () => {
      cancelled = true;
      recognition.abort();
    },
  };
}

/* ------------------------------------------------------------------
   Speaking
------------------------------------------------------------------- */

function voicesNow(): SpeechSynthesisVoice[] {
  return canSpeak() ? window.speechSynthesis.getVoices() : [];
}

/** Voices load asynchronously in Chrome; this waits briefly for the list. */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!canSpeak()) return Promise.resolve([]);
  const existing = voicesNow();
  if (existing.length) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const done = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', done);
      resolve(voicesNow());
    };
    window.speechSynthesis.addEventListener('voiceschanged', done);
    window.setTimeout(done, 1500);
  });
}

/** Best voice for a locale: exact match, then same language; local voices win ties. */
export function pickVoice(
  voices: SpeechSynthesisVoice[],
  locale: string,
): SpeechSynthesisVoice | undefined {
  const lang = locale.slice(0, 2).toLowerCase();
  const normalised = (voice: SpeechSynthesisVoice) => voice.lang.replace('_', '-').toLowerCase();
  const exact = voices.filter((voice) => normalised(voice) === locale.toLowerCase());
  const sameLanguage = voices.filter((voice) => normalised(voice).startsWith(lang));
  const pool = exact.length ? exact : sameLanguage;
  return pool.find((voice) => voice.localService) ?? pool[0];
}

/**
 * Says `text` aloud and resolves when finished. Resolves `false` straight away
 * when no suitable voice exists, so the caller can rely on the text alone.
 */
export function speak(text: string, voice: SpeechSynthesisVoice | undefined, locale: string): Promise<boolean> {
  if (!canSpeak() || !voice || !text.trim()) return Promise.resolve(false);

  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang || locale;
    // A little slower than default is easier to follow.
    utterance.rate = 0.9;
    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(true);
    synth.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}
