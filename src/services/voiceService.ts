import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

/**
 * Native voice I/O belongs behind this small boundary, just like the assistant
 * itself. The web build stays usable; voice input is offered only in the
 * installed Android app where the required native services are available.
 */

export class VoiceUnavailableError extends Error {
  constructor() {
    super('Voice input is available in the installed Android app.');
  }
}

export interface VoiceSession {
  stop(): Promise<void>;
}

export interface StartListeningOptions {
  language?: string;
  onPartial(text: string, alternatives: string[]): void;
  onComplete(text: string, alternatives: string[]): void;
}

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function voiceInputAvailable(): Promise<boolean> {
  if (!isNative()) return false;
  const { available } = await SpeechRecognition.available();
  return available;
}

/** Starts one deliberate push-to-talk turn. It never listens in the background. */
export async function startListening(options: StartListeningOptions): Promise<VoiceSession> {
  if (!(await voiceInputAvailable())) throw new VoiceUnavailableError();

  const permission = await SpeechRecognition.checkPermissions();
  const granted =
    permission.speechRecognition === 'granted'
      ? permission
      : await SpeechRecognition.requestPermissions();

  if (granted.speechRecognition !== 'granted') {
    throw new Error('Microphone permission is needed to use voice input.');
  }

  let alternatives: string[] = [];
  let finished = false;
  const listeners: PluginListenerHandle[] = [];

  const removeListeners = async () => {
    await Promise.all(listeners.map((listener) => listener.remove()));
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    void removeListeners();
    options.onComplete(alternatives[0]?.trim() ?? '', alternatives);
  };

  listeners.push(
    await SpeechRecognition.addListener('partialResults', ({ matches }) => {
      alternatives = matches.filter((match) => match.trim().length > 0);
      options.onPartial(alternatives[0] ?? '', alternatives);
    }),
  );
  listeners.push(
    await SpeechRecognition.addListener('listeningState', ({ status }) => {
      if (status === 'stopped') finish();
    }),
  );

  try {
    await SpeechRecognition.start({
      // The device language gives Google's recognizer the best chance of
      // understanding the person's accent and chosen language.
      language: options.language ?? navigator.language ?? 'en-IN',
      maxResults: 3,
      partialResults: true,
      // The in-app control already communicates listening state clearly.
      popup: false,
    });
  } catch (error) {
    await removeListeners();
    throw error;
  }

  return {
    async stop() {
      await SpeechRecognition.stop();
      finish();
    },
  };
}

/** Reads a completed assistant answer aloud using the Android device's TTS voice. */
export async function speakText(text: string, language = 'en-IN'): Promise<void> {
  if (!isNative() || !text.trim()) return;
  await TextToSpeech.stop();
  await TextToSpeech.speak({
    text,
    lang: language,
    // A slightly slower pace is easier to follow for the intended users.
    rate: 0.9,
  });
}
