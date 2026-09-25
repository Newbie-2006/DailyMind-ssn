import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { assistant, greetingMessage, type AssistantContext } from '../services/assistantService';
import { useTranslation } from '../i18n/useTranslation';
import { caregiversWithLocationAccess } from '../services/caregiverAccess';
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

function clockTime(): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 === 0 ? 12 : hours % 12}:${minutes} ${suffix}`;
}

export function Assistant() {
  const { memories, routines, completions, settings, caregivers, location } = useAppData();
  const { t, language } = useTranslation();

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  // Fixed at mount so the greeting's timestamp does not jump on re-render.
  const [openedAt] = useState(clockTime);

  /**
   * The opening turn is derived rather than stored, so it is always written in
   * the language currently selected - a non-English dictionary arrives as a
   * separate chunk just after the first render, and a stored greeting would be
   * stranded in English. Everything the person actually said lives in `turns`.
   */
  const greeting = useMemo(() => greetingMessage(settings.name, t), [settings.name, t]);

  const context = useMemo<AssistantContext>(
    () => ({
      userName: settings.name,
      date: today(),
      routines,
      completions,
      memories,
      language,
      t,
      location: {
        sharingEnabled: location.sharingEnabled,
        lastUpdated: location.lastFix?.timestamp,
        sharedWith: caregiversWithLocationAccess(caregivers, settings).map(
          (caregiver) => caregiver.name,
        ),
      },
    }),
    [settings, routines, completions, memories, language, t, location, caregivers],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, thinking]);

  const send = useCallback(
    async (text: string) => {
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
      } catch {
        setError(t('assistant.error'));
      } finally {
        setThinking(false);
      }
    },
    [context, t],
  );

  const lastAssistant = [...turns].reverse().find((turn) => turn.role === 'assistant');
  const suggestions = thinking
    ? []
    : (lastAssistant?.reply?.suggestions ?? greeting.suggestions ?? []);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <PageHeader title={t('assistant.title')} />

      <div className="dm-gutter flex-1 space-y-4 pt-6 pb-4">
        <AssistantBubble reply={greeting} time={openedAt} />

        {turns.map((turn) =>
          turn.role === 'user' ? (
            <UserMessage key={turn.id} text={turn.text ?? ''} time={turn.time} />
          ) : (
            turn.reply && <AssistantBubble key={turn.id} reply={turn.reply} time={turn.time} />
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

      <div className="dm-gutter sticky bottom-0 space-y-3 bg-canvas/95 pt-3 pb-4 backdrop-blur-sm">
        {suggestions.length > 0 ? (
          <SuggestionRow suggestions={suggestions} onPick={(text) => void send(text)} />
        ) : null}
        <ChatInput onSend={(text) => void send(text)} disabled={thinking} />
      </div>
    </div>
  );
}
