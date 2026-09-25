import { ArrowRight, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AssistantReply } from '../services/assistantService';
import { RoutineIconGlyph } from './RoutineIconGlyph';
import { MemoryImage } from './MemoryImage';
import { useTranslation } from '../i18n/useTranslation';

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  /** Present on assistant turns. */
  reply?: AssistantReply;
  /** Present on user turns. */
  text?: string;
  time: string;
}

export function UserMessage({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex flex-col items-end">
      <div className="max-w-[80%] rounded-[1.125rem] rounded-br-md bg-forest px-4 py-3 text-[0.9375rem] leading-relaxed text-canvas">
        {text}
      </div>
      <span className="mt-1 pr-1 text-[0.6875rem] text-ink-faint">{time}</span>
    </div>
  );
}

export function AssistantBubble({ reply, time }: { reply: AssistantReply; time: string }) {
  return (
    <div className="flex flex-col items-start">
      <div className="max-w-[88%] rounded-[1.125rem] rounded-bl-md bg-surface px-4 py-3.5 shadow-soft">
        <p className="text-[0.9375rem] leading-relaxed text-ink">{reply.text}</p>

        {reply.items?.length ? (
          <ul className="mt-3 space-y-1.5">
            {reply.items.map((item) => (
              <li key={item.id}>
                <ItemRow item={item} />
              </li>
            ))}
          </ul>
        ) : null}

        {reply.footer ? (
          <p className="mt-3 border-t border-line-soft pt-2.5 text-[0.8125rem] leading-relaxed text-ink-soft">
            {reply.footer}
          </p>
        ) : null}

        {reply.action ? (
          <Link
            to={reply.action.to}
            className="tap mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-sage-wash px-3.5 text-[0.8125rem] font-medium text-forest-deep"
          >
            {reply.action.label}
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      <span className="mt-1 pl-1 text-[0.6875rem] text-ink-faint">{time}</span>
    </div>
  );
}

function ItemRow({ item }: { item: NonNullable<AssistantReply['items']>[number] }) {
  const content = (
    <>
      {item.image ? (
        <MemoryImage src={item.image} alt="" className="size-8 shrink-0" rounded="rounded-lg" />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sage-wash text-forest-soft"
        >
          {item.icon ? <RoutineIconGlyph icon={item.icon} size={15} /> : <Sprout size={15} />}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-[0.875rem] text-ink">{item.label}</span>
      {item.meta ? (
        <span className="shrink-0 text-[0.8125rem] tabular-nums text-ink-soft">{item.meta}</span>
      ) : null}
    </>
  );

  if (!item.to) {
    return <div className="flex items-center gap-2.5 rounded-xl bg-surface-sunk px-2.5 py-2">{content}</div>;
  }

  return (
    <Link
      to={item.to}
      className="tap flex items-center gap-2.5 rounded-xl bg-surface-sunk px-2.5 py-2 transition-colors duration-150 active:bg-beige"
    >
      {content}
    </Link>
  );
}

/** Three quiet dots while the assistant is working out its answer. */
export function TypingBubble() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 rounded-[1.125rem] rounded-bl-md bg-surface px-4 py-4 shadow-soft">
      <span className="sr-only">{t('assistant.replying')}</span>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          aria-hidden="true"
          className="size-1.5 animate-pulse rounded-full bg-sage"
          style={{ animationDelay: `${index * 160}ms` }}
        />
      ))}
    </div>
  );
}

export function SuggestionRow({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick(suggestion: string): void;
}) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onPick(suggestion)}
          className="tap min-h-10 shrink-0 rounded-full border border-line bg-surface px-3.5 text-[0.8125rem] text-ink-soft transition-colors duration-150 active:bg-surface-sunk"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
