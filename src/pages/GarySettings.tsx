import { useState } from 'react';
import { Eye, EyeOff, KeyRound, ShieldAlert } from 'lucide-react';
import type { GaryLanguage } from '../types';
import { useAppData } from '../hooks/useAppData';
import { defaultGarySettings } from '../data/seed';
import { GaryError, testApiKey } from '../services/gary/client';
import { PageHeader } from '../components/PageHeader';
import { Card, SectionTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChoiceChip, FieldGroup, TextField } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/toastContext';

const LANGUAGE_OPTIONS: { id: GaryLanguage; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'ta', label: 'தமிழ் (Tamil)' },
];

const ADDRESS_SUGGESTIONS = ['Paati', 'Thaatha', 'Amma', 'Appa'];

type KeyCheck = { state: 'idle' } | { state: 'checking' } | { state: 'ok' } | { state: 'failed'; message: string };

/**
 * Set up by a family member, not by the person Gary talks to: the key, the
 * default language and how Gary should address them.
 */
export function GarySettingsPage() {
  const { gary, actions } = useAppData();
  const { notify } = useToast();

  const [apiKey, setApiKey] = useState(gary.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [language, setLanguage] = useState<GaryLanguage>(gary.language);
  const [addressAs, setAddressAs] = useState(gary.addressAs);
  const [model, setModel] = useState(gary.model);
  const [check, setCheck] = useState<KeyCheck>({ state: 'idle' });
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const save = () => {
    actions.updateGarySettings({
      apiKey: apiKey.trim(),
      language,
      addressAs: addressAs.trim(),
      model: model.trim() || defaultGarySettings.model,
    });
    notify('Gary settings saved');
  };

  const runCheck = async () => {
    setCheck({ state: 'checking' });
    try {
      await testApiKey(apiKey, model.trim() || defaultGarySettings.model);
      setCheck({ state: 'ok' });
    } catch (error) {
      const code = error instanceof GaryError ? error.code : 'unknown';
      const status = error instanceof GaryError ? error.status : undefined;
      const apiMessage = error instanceof GaryError ? error.apiMessage : undefined;
      const summary =
        code === 'invalid_key'
          ? 'Anthropic did not accept this key.'
          : code === 'no_key'
            ? 'Enter a key first.'
            : code === 'network' || code === 'timeout'
              ? 'Could not reach Anthropic. Check the internet connection.'
              : code === 'rate_limited' || code === 'overloaded'
                ? 'The key looks fine, but the service is busy. Try again shortly.'
                : status === 404
                  ? 'Anthropic does not recognise this model name for your key. Check it under Advanced.'
                  : status === 403
                    ? 'This key is not allowed to use this model.'
                    : 'Anthropic turned the request down.';
      // Anthropic's own words are the most useful thing to show, e.g. a low credit balance.
      const message = apiMessage
        ? `${summary} Anthropic says: “${apiMessage}”${status ? ` (HTTP ${status})` : ''}`
        : `${summary}${status ? ` (HTTP ${status})` : ''}`;
      setCheck({ state: 'failed', message });
    }
  };

  const removeKey = () => {
    setApiKey('');
    actions.updateGarySettings({ apiKey: '' });
    setConfirmingRemove(false);
    setCheck({ state: 'idle' });
    notify('Key removed from this device');
  };

  return (
    <div className="pb-10">
      <PageHeader title="Gary voice assistant" onBack fallbackTo="/profile" />

      <div className="space-y-6 px-5 pt-2">
        <Card surface="sage" className="px-4 py-4">
          <p className="text-[0.875rem] leading-relaxed text-forest-deep">
            Gary answers out loud from what is saved in DailyMind: today’s routines, memories and
            the family details you add. He only marks a routine done after the person says yes or
            taps Yes.
          </p>
        </Card>

        <section>
          <SectionTitle>Anthropic API key</SectionTitle>
          <div className="space-y-3">
            <div className="relative">
              <TextField
                label="Key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(event) => {
                  setApiKey(event.target.value);
                  setCheck({ state: 'idle' });
                }}
                placeholder="sk-ant-…"
                autoComplete="off"
                spellCheck={false}
                hint="Create one in the Anthropic Console. It is stored only in this browser."
              />
              <button
                type="button"
                onClick={() => setShowKey((current) => !current)}
                aria-label={showKey ? 'Hide key' : 'Show key'}
                className="tap absolute top-[1.85rem] right-1.5 inline-flex size-11 items-center justify-center rounded-full text-ink-soft"
              >
                {showKey ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => void runCheck()} disabled={!apiKey.trim() || check.state === 'checking'}>
                <KeyRound size={17} strokeWidth={1.8} aria-hidden="true" />
                {check.state === 'checking' ? 'Checking…' : 'Check key'}
              </Button>
              {gary.apiKey ? (
                <Button variant="quiet" onClick={() => setConfirmingRemove(true)}>
                  Remove key
                </Button>
              ) : null}
            </div>

            {check.state === 'ok' ? (
              <p role="status" className="text-[0.875rem] text-forest-soft">
                The key works. Remember to save.
              </p>
            ) : null}
            {check.state === 'failed' ? (
              <p role="alert" className="text-[0.875rem] text-clay">
                {check.message}
              </p>
            ) : null}

            <Card surface="beige" className="flex items-start gap-3 px-4 py-3.5">
              <ShieldAlert size={18} strokeWidth={1.6} aria-hidden="true" className="mt-0.5 shrink-0 text-clay" />
              <p className="text-[0.8125rem] leading-relaxed text-ink-soft">
                Anyone using this browser could read this key. Use a key with a monthly spending
                limit, and only on a device the family trusts. Routine, memory note and family
                details are sent to Anthropic to answer each question; photos are not.
              </p>
            </Card>
          </div>
        </section>

        <FieldGroup label="Gary speaks" hint="Can also be switched on Gary’s screen.">
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((option) => (
              <ChoiceChip key={option.id} selected={language === option.id} onClick={() => setLanguage(option.id)}>
                {option.label}
              </ChoiceChip>
            ))}
          </div>
        </FieldGroup>

        <div>
          <TextField
            label="Gary calls them"
            value={addressAs}
            onChange={(event) => setAddressAs(event.target.value)}
            placeholder="Their first name"
            hint="Leave empty to use their first name."
          />
          <div className="mt-2.5 flex flex-wrap gap-2">
            {ADDRESS_SUGGESTIONS.map((suggestion) => (
              <ChoiceChip key={suggestion} selected={addressAs === suggestion} onClick={() => setAddressAs(suggestion)}>
                {suggestion}
              </ChoiceChip>
            ))}
          </div>
        </div>

        <details className="rounded-2xl bg-surface-sunk px-4 py-3">
          <summary className="tap min-h-11 cursor-pointer py-2 text-[0.9375rem] text-ink-soft">Advanced</summary>
          <TextField
            className="mt-2 pb-2"
            label="Claude model"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            spellCheck={false}
            hint={`Default ${defaultGarySettings.model}: fast and inexpensive. A Sonnet model gives better Tamil.`}
          />
        </details>

        <Button size="lg" onClick={save}>
          Save Gary settings
        </Button>
      </div>

      <Modal
        open={confirmingRemove}
        onClose={() => setConfirmingRemove(false)}
        title="Remove the key?"
        description="Gary will stop working on this device until a key is added again."
        actions={
          <>
            <Button size="lg" onClick={removeKey}>
              Remove key
            </Button>
            <Button size="lg" variant="quiet" onClick={() => setConfirmingRemove(false)}>
              Cancel
            </Button>
          </>
        }
      />
    </div>
  );
}
