import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUp, Keyboard, Mic, Square, X } from 'lucide-react';
import type { GaryController, GaryTurn } from '../../hooks/useGary';
import type { GaryEffect } from '../../services/gary/tools';
import type { GaryLanguage } from '../../types';
import { ConfirmCard, MemoryCard, PersonCard, RoutineCard, ScheduleCard } from './GaryCards';

interface GaryOverlayProps {
  gary: GaryController;
  onClose(): void;
  onOpenMemory(memoryId: string): void;
  onOpenSetup(): void;
}

const LANGUAGES: { id: GaryLanguage; label: string; lang: string }[] = [
  { id: 'en', label: 'EN', lang: 'en' },
  { id: 'ta', label: 'தமிழ்', lang: 'ta' },
];

/**
 * Gary's full-screen view: what was said, a large card for whatever Gary is
 * talking about, and one big button. Everything can also be done by touch.
 */
export function GaryOverlay({ gary, onClose, onOpenMemory, onOpenSetup }: GaryOverlayProps) {
  const { text, turns, status, interim, notice, hint, pending, configured } = gary;
  const [typing, setTyping] = useState(!gary.listenSupported);
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, interim, pending]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const words = draft.trim();
    if (!words || status === 'thinking') return;
    setDraft('');
    void gary.ask(words);
  };

  const statusLine =
    status === 'listening'
      ? text.listening
      : status === 'thinking'
        ? text.thinking
        : status === 'speaking'
          ? text.speaking
          : text.tapToSpeak;

  const lastGary = [...turns].reverse().find((turn) => turn.from === 'gary');
  const showStarters = configured && turns.filter((turn) => turn.from === 'person').length === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={text.title}
      lang={gary.language}
      className="animate-fade absolute inset-0 z-50 flex flex-col bg-canvas"
    >
      <header className="safe-top shrink-0 border-b border-line-soft bg-canvas">
        <div className="flex min-h-16 items-center gap-3 px-4 py-2">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-forest font-display text-[1.25rem] text-canvas"
          >
            G
          </span>
          <h1 className="min-w-0 flex-1 font-display text-[1.625rem] leading-none text-ink">{text.title}</h1>

          <div role="group" aria-label={text.languageLabel} className="flex rounded-full bg-surface-sunk p-1">
            {LANGUAGES.map((option) => (
              <button
                key={option.id}
                type="button"
                lang={option.lang}
                aria-pressed={gary.language === option.id}
                onClick={() => gary.setLanguage(option.id)}
                className={`tap min-h-11 min-w-14 rounded-full px-3.5 text-[1rem] font-semibold transition-colors duration-150 ${
                  gary.language === option.id ? 'bg-forest text-canvas' : 'text-ink-soft'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={text.close}
            title={text.close}
            className="tap inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-ink-soft active:bg-beige"
          >
            <X size={24} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-4">
        {notice ? (
          <p role="status" className="mb-4 rounded-2xl bg-beige px-4 py-3 text-[0.9375rem] leading-relaxed text-ink-soft">
            {notice}
          </p>
        ) : null}

        {hint ? (
          <p role="status" className="mb-4 rounded-2xl bg-clay-soft px-4 py-3 text-[0.9375rem] leading-relaxed text-ink">
            {hint}
          </p>
        ) : null}

        {!configured ? (
          <div className="mb-4 rounded-card bg-clay-soft px-5 py-5">
            <p className="text-[1.25rem] font-semibold text-ink">{text.needsSetup}</p>
            <p className="mt-2 text-[1rem] leading-relaxed text-ink-soft">{text.needsSetupBody}</p>
            <button
              type="button"
              onClick={onOpenSetup}
              className="tap mt-4 inline-flex min-h-12 items-center rounded-full bg-forest px-5 text-[1rem] font-medium text-canvas"
            >
              {text.openSetup}
            </button>
          </div>
        ) : null}

        <div className="space-y-4" aria-live="polite">
          {turns.map((turn) => (
            <TurnView
              key={turn.id}
              turn={turn}
              gary={gary}
              isLatest={turn === lastGary}
              onOpenMemory={onOpenMemory}
            />
          ))}

          {interim ? (
            <p className="ml-auto max-w-[85%] rounded-[1.25rem] rounded-br-md bg-sage-soft px-4 py-3 text-[1.125rem] text-forest-deep italic">
              {interim}
            </p>
          ) : null}
        </div>

        {showStarters ? (
          <div className="mt-5 flex flex-col gap-2.5">
            {text.starters.map((starter) => (
              <button
                key={starter}
                type="button"
                disabled={status === 'thinking'}
                onClick={() => void gary.ask(starter)}
                className="tap min-h-14 rounded-2xl border border-line bg-surface px-5 text-left text-[1.125rem] text-ink active:bg-surface-sunk disabled:opacity-50"
              >
                {starter}
              </button>
            ))}
          </div>
        ) : null}

        <div ref={endRef} />
      </div>

      <div className="safe-bottom shrink-0 border-t border-line-soft bg-canvas/95 px-4 pt-3 pb-4 backdrop-blur-sm">
        {pending ? (
          <div className="mb-3">
            <ConfirmCard routineId={pending.routineId} text={text} onAnswer={gary.confirm} />
          </div>
        ) : null}

        {gary.listenSupported ? (
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={gary.tapMic}
              disabled={!configured}
              aria-label={status === 'idle' ? text.micLabel : text.stopLabel}
              className={`tap relative flex size-24 items-center justify-center rounded-full text-canvas shadow-lift transition-transform duration-150 active:scale-95 disabled:opacity-40 ${
                status === 'listening' ? 'bg-clay' : 'bg-forest'
              }`}
            >
              {status === 'listening' ? (
                <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-clay opacity-30" />
              ) : null}
              {status === 'idle' || status === 'listening' ? (
                <Mic size={40} strokeWidth={2} aria-hidden="true" />
              ) : (
                <Square size={30} strokeWidth={2.2} aria-hidden="true" />
              )}
            </button>
            <p role="status" className="mt-2.5 text-center text-[1.0625rem] font-medium text-ink-soft">
              {statusLine}
            </p>
          </div>
        ) : null}

        {typing ? (
          <form onSubmit={submit} className="mt-3 flex items-center gap-2">
            <label htmlFor="gary-input" className="sr-only">
              {text.typePlaceholder}
            </label>
            <input
              id="gary-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={text.typePlaceholder}
              autoComplete="off"
              enterKeyHint="send"
              disabled={!configured}
              className="min-h-14 w-full rounded-full border border-line bg-surface px-5 text-[1.0625rem] text-ink placeholder:text-ink-faint focus:border-sage focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              aria-label={text.send}
              disabled={!configured || !draft.trim() || status === 'thinking'}
              className="tap inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-forest text-canvas active:scale-95 disabled:opacity-35"
            >
              <ArrowUp size={22} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </form>
        ) : gary.listenSupported ? (
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setTyping(true)}
              className="tap inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[0.9375rem] text-ink-soft active:bg-surface-sunk"
            >
              <Keyboard size={18} strokeWidth={1.8} aria-hidden="true" />
              {text.typeInstead}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TurnView({
  turn,
  gary,
  isLatest,
  onOpenMemory,
}: {
  turn: GaryTurn;
  gary: GaryController;
  isLatest: boolean;
  onOpenMemory(memoryId: string): void;
}) {
  if (turn.from === 'person') {
    return (
      <p className="ml-auto max-w-[85%] rounded-[1.25rem] rounded-br-md bg-forest px-4 py-3 text-[1.125rem] leading-relaxed text-canvas">
        {turn.text}
      </p>
    );
  }

  // Older turns keep their cards but at a quieter weight; the latest is what matters.
  const cards = uniqueCards(turn.effects);

  return (
    <div className={`space-y-3 ${isLatest ? '' : 'opacity-80'}`}>
      <p
        className={`max-w-[92%] rounded-[1.25rem] rounded-bl-md px-4 py-3.5 leading-relaxed ${
          turn.isError ? 'bg-clay-soft text-[1.0625rem] text-ink' : 'bg-surface text-[1.25rem] text-ink shadow-soft'
        }`}
      >
        {turn.text}
      </p>
      {cards.map((effect) => (
        <EffectCard key={effectKey(effect)} effect={effect} gary={gary} onOpenMemory={onOpenMemory} />
      ))}
    </div>
  );
}

function EffectCard({
  effect,
  gary,
  onOpenMemory,
}: {
  effect: GaryEffect;
  gary: GaryController;
  onOpenMemory(memoryId: string): void;
}) {
  switch (effect.kind) {
    case 'schedule':
      return <ScheduleCard date={effect.date} text={gary.text} />;
    case 'routine':
      return <RoutineCard routineId={effect.routineId} text={gary.text} onDone={gary.proposeDone} />;
    case 'memory':
      return <MemoryCard memoryId={effect.memoryId} text={gary.text} onOpen={onOpenMemory} />;
    case 'person':
      return <PersonCard memberId={effect.memberId} />;
    case 'confirmDone':
      // Shown pinned above the button while it is pending, not in the log.
      return null;
  }
}

function effectKey(effect: GaryEffect): string {
  switch (effect.kind) {
    case 'schedule':
      return `schedule-${effect.date}`;
    case 'routine':
      return `routine-${effect.routineId}`;
    case 'memory':
      return `memory-${effect.memoryId}`;
    case 'person':
      return `person-${effect.memberId}`;
    case 'confirmDone':
      return `confirm-${effect.routineId}`;
  }
}

/** One card per thing, even if Gary looked it up twice. */
function uniqueCards(effects: GaryEffect[]): GaryEffect[] {
  const seen = new Set<string>();
  return effects.filter((effect) => {
    const key = effectKey(effect);
    if (effect.kind === 'confirmDone' || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
