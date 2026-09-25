import { useState, type FormEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export function ChatInput({
  onSend,
  disabled = false,
  placeholder,
}: {
  onSend(text: string): void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const { t } = useTranslation();
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
        {t('assistant.askLabel')}
      </label>
      <input
        id="assistant-input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder ?? t('assistant.inputPlaceholder')}
        autoComplete="off"
        enterKeyHint="send"
        className="min-h-12 w-full rounded-full border border-line bg-surface px-4 text-[0.9375rem] text-ink placeholder:text-ink-faint focus:border-sage focus:outline-none"
      />
      <button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        aria-label={t('assistant.send')}
        className="tap inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-forest text-canvas transition-[opacity,transform] duration-150 active:scale-95 disabled:opacity-35"
      >
        <ArrowUp size={19} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </form>
  );
}
