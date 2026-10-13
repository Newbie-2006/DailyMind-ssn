import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { assistant, greetingMessage, type AssistantContext } from '../services/assistantService';
import { today } from '../utils/date';
import { createId } from '../utils/format';
import { PageHeader } from '../components/PageHeader';
import {
  AssistantBubble,
  SuggestionRow,
  TypingBubble,
  UserMessage,
  type ChatTurn,
} from '../components/AssistantMessage';
import { ChatInput } from '../components/ChatInput';
import { speakText } from '../services/voiceService';

function clockTime(): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 === 0 ? 12 : hours % 12}:${minutes} ${suffix}`;
}

export function Assistant() {
  const { memories, routines, completions, settings } = useAppData();

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  // The opening turn is generated, not hardcoded, so it reflects the real day.
  useEffect(() => {
    setTurns([
      {
        id: createId('turn'),
        role: 'assistant',
        reply: greetingMessage(settings.name),
        time: clockTime(),
      },
    ]);
    // Only on mount: re-greeting on every settings change would be noise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const context = useMemo<AssistantContext>(
    () => ({
      userName: settings.name,
      date: today(),
      routines,
      completions,
      memories,
    }),
    [settings.name, routines, completions, memories],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, thinking]);

  const send = useCallback(
    async (text: string, readReplyAloud = false) => {
      setError(null);
      setTurns((current) => [
        ...current,
        { id: createId('turn'), role: 'user', text, time: clockTime() },
      ]);
      setThinking(true);

      try {
        const reply = await assistant.reply(text, context);
        setTurns((current) => [
          ...current,
          { id: createId('turn'), role: 'assistant', reply, time: clockTime() },
        ]);
        if (readReplyAloud) await speakText(reply.text);
      } catch {
        setError('Something went wrong reaching the assistant. Please try again.');
      } finally {
        setThinking(false);
      }
    },
    [context],
  );

  const lastAssistant = [...turns].reverse().find((turn) => turn.role === 'assistant');
  const suggestions = !thinking ? (lastAssistant?.reply?.suggestions ?? []) : [];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <PageHeader title="Gary" />

      <div className="flex-1 space-y-4 px-5 pt-2 pb-4">
        {turns.map((turn) =>
          turn.role === 'user' ? (
            <UserMessage key={turn.id} text={turn.text ?? ''} time={turn.time} />
          ) : (
            turn.reply && (
              <AssistantBubble
                key={turn.id}
                reply={turn.reply}
                time={turn.time}
                onSpeak={(text) => void speakText(text)}
              />
            )
          ),
        )}

        {thinking ? (
          <div className="flex justify-start">
            <TypingBubble />
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="rounded-2xl bg-clay-soft px-4 py-3 text-[0.875rem] text-clay">
            {error}
          </p>
        ) : null}

        <div ref={endRef} />
      </div>

      <div className="safe-bottom sticky bottom-0 space-y-3 bg-canvas/95 px-5 pt-3 pb-4 backdrop-blur-sm">
        {suggestions.length > 0 ? (
          <SuggestionRow suggestions={suggestions} onPick={(text) => void send(text)} />
        ) : null}
        <ChatInput
          onSend={(text) => void send(text)}
          onVoiceSend={(text) => void send(text, true)}
          placeholder="Ask Gary anything..."
          disabled={thinking}
        />
      </div>
    </div>
  );
}
