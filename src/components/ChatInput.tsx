import { useEffect, useRef, useState, type FormEvent } from 'react';
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
}: {
  onSend(text: string): void;
  /** A completed push-to-talk turn. The parent may choose to read its reply aloud. */
  onVoiceSend?(text: string): void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState('');
  const [listening, setListening] = useState(false);
  const [starting, setStarting] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);
  const startingRef = useRef(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const startVoiceInput = async () => {
    if (disabled || startingRef.current || sessionRef.current) return;
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
          const command = spoken.find((candidate) => candidate.trim())?.trim() ?? null;
          if (command) {
            setValue('');
            (onVoiceSend ?? onSend)(command);
          }
        },
      });
      sessionRef.current = nextSession;
      setListening(true);
    } catch (error) {
      if (error instanceof VoiceUnavailableError) {
        setVoiceError(error.message);
      } else {
        setVoiceError(error instanceof Error ? error.message : 'Voice input could not start.');
      }
      setListening(false);
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  };

  useEffect(() => {
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
    if (sessionRef.current) {
      void sessionRef.current.stop();
      sessionRef.current = null;
      return;
    }
    void startVoiceInput();
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
          aria-label={listening ? 'Stop voice input' : 'Start voice input'}
          aria-pressed={listening}
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
          {listening
            ? 'Listening… Tap the microphone again when you finish speaking.'
            : starting
              ? 'Preparing voice input…'
              : 'Tap the microphone and speak your request.'}
        </p>
      ) : null}
      {voiceError ? <p role="alert" className="px-2 text-[0.75rem] text-clay">{voiceError}</p> : null}
    </form>
  );
}
