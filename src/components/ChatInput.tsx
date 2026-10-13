import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUp, Mic, Square } from 'lucide-react';
import {
  startListening,
  VoiceUnavailableError,
  type VoiceSession,
} from '../services/voiceService';

export function ChatInput({
  onSend,
  onVoiceSend,
  disabled = false,
  placeholder = 'Ask anything...',
  wakeWord = 'Hey Gary',
}: {
  onSend(text: string): void;
  /** A completed push-to-talk turn. The parent may choose to read its reply aloud. */
  onVoiceSend?(text: string): void;
  disabled?: boolean;
  placeholder?: string;
  /** Voice requests are sent only after this phrase has been recognised. */
  wakeWord?: string;
}) {
  const [value, setValue] = useState('');
  const [listening, setListening] = useState(false);
  const [starting, setStarting] = useState(false);
  const [wakeEnabled, setWakeEnabled] = useState(true);
  const [awaitingCommand, setAwaitingCommand] = useState(false);
  const [waitingForReply, setWaitingForReply] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);
  const startingRef = useRef(false);
  const wasDisabledRef = useRef(disabled);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const startWakeListening = useCallback(async () => {
    if (disabled || startingRef.current || sessionRef.current || !wakeEnabled) return;
    startingRef.current = true;
    setStarting(true);
    setVoiceError(null);
    try {
      const nextSession = await startListening({
        onPartial: (transcript) => setValue(transcript),
        onComplete: (transcript, alternatives) => {
          sessionRef.current = null;
          setListening(false);
          const spoken = alternatives.length > 0 ? alternatives : [transcript];
          if (!spoken.some((candidate) => candidate.trim())) return;

          const command = awaitingCommand
            ? spoken.find((candidate) => candidate.trim())?.trim() ?? null
            : spoken.map((candidate) => commandAfterWakeWord(candidate, wakeWord)).find(Boolean) ?? null;
          if (command) {
            setValue('');
            setAwaitingCommand(false);
            setWaitingForReply(true);
            (onVoiceSend ?? onSend)(command);
            return;
          }

          if (spoken.some((candidate) => isWakeWordOnly(candidate, wakeWord))) {
            setAwaitingCommand(true);
            setValue('');
          }
        },
      });
      sessionRef.current = nextSession;
      setListening(true);
    } catch (error) {
      if (error instanceof VoiceUnavailableError) {
        setWakeEnabled(false);
      } else {
        setVoiceError(error instanceof Error ? error.message : 'Voice input could not start.');
        setWakeEnabled(false);
      }
      setListening(false);
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }, [awaitingCommand, disabled, onSend, onVoiceSend, wakeEnabled, wakeWord]);

  // While Gary's page is open, restart Android's one-shot recognizer after
  // each turn. This makes “Hey Gary, …” hands-free without background listening.
  useEffect(() => {
    if (!wakeEnabled || disabled || waitingForReply) return;
    void startWakeListening();
  }, [disabled, startWakeListening, wakeEnabled, waitingForReply]);

  useEffect(() => {
    if (wasDisabledRef.current && !disabled) setWaitingForReply(false);
    wasDisabledRef.current = disabled;
    if (disabled && sessionRef.current) {
      void sessionRef.current.stop();
      sessionRef.current = null;
      setListening(false);
    }
  }, [disabled]);

  useEffect(
    () => () => {
      if (sessionRef.current) void sessionRef.current.stop();
    },
    [],
  );

  const toggleListening = () => {
    if (wakeEnabled) {
      setWakeEnabled(false);
      setAwaitingCommand(false);
      if (sessionRef.current) {
        void sessionRef.current.stop();
        sessionRef.current = null;
      }
      setListening(false);
      return;
    }

    setVoiceError(null);
    setWakeEnabled(true);
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="assistant-input" className="sr-only">
        Ask DailyMind
      </label>
      <div className="flex items-center gap-2">
        <input
          id="assistant-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={listening ? 'Listening…' : placeholder}
          autoComplete="off"
          enterKeyHint="send"
          className="min-h-12 w-full rounded-full border border-line bg-surface px-4 text-[0.9375rem] text-ink placeholder:text-ink-faint focus:border-sage focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void toggleListening()}
          disabled={disabled}
          aria-label={wakeEnabled ? 'Turn off Gary voice listening' : 'Turn on Gary voice listening'}
          aria-pressed={wakeEnabled}
          className="tap inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-sage bg-sage-wash text-forest transition-[opacity,transform] duration-150 active:scale-95 disabled:opacity-35"
        >
          {listening ? <Square size={17} fill="currentColor" aria-hidden="true" /> : <Mic size={19} aria-hidden="true" />}
        </button>
        <button
          type="submit"
          disabled={disabled || value.trim().length === 0}
          aria-label="Send message"
          className="tap inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-forest text-canvas transition-[opacity,transform] duration-150 active:scale-95 disabled:opacity-35"
        >
          <ArrowUp size={19} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
      {!voiceError ? (
        <p className="px-2 text-[0.75rem] text-ink-faint">
          {wakeEnabled
            ? awaitingCommand
              ? 'Gary is listening for your request…'
              : listening
                ? `Listening for “${wakeWord}”…`
                : starting
                  ? 'Gary is starting voice recognition…'
                  : 'Gary is restarting voice recognition…'
            : 'Voice listening is off.'}
        </p>
      ) : null}
      {voiceError ? <p role="alert" className="px-2 text-[0.75rem] text-clay">{voiceError}</p> : null}
    </form>
  );
}

function commandAfterWakeWord(transcript: string, wakeWord: string): string | null {
  const escapedWakeWord = wakeWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  const match = transcript.match(new RegExp(`^\\s*${escapedWakeWord}\\b[\\s,!.?:;-]*(.*)$`, 'i'));
  const command = match?.[1]?.trim();
  return command || null;
}

function isWakeWordOnly(transcript: string, wakeWord: string): boolean {
  return transcript.trim().toLocaleLowerCase() === wakeWord.toLocaleLowerCase();
}
