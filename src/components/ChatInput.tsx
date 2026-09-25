import { useState, type FormEvent } from 'react';
import { ArrowUp } from 'lucide-react';

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask anything...',
}: {
  onSend(text: string): void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <label htmlFor="assistant-input" className="sr-only">
        Ask DailyMind
      </label>
      <input
        id="assistant-input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="send"
        className="min-h-12 w-full rounded-full border border-line bg-surface px-4 text-[0.9375rem] text-ink placeholder:text-ink-faint focus:border-sage focus:outline-none"
      />
      <button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        aria-label="Send message"
        className="tap inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-forest text-canvas transition-[opacity,transform] duration-150 active:scale-95 disabled:opacity-35"
      >
        <ArrowUp size={19} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </form>
  );
}
