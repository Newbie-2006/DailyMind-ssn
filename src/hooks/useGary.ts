import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GaryLanguage } from '../types';
import { useAppData } from './useAppData';
import { today } from '../utils/date';
import { createId } from '../utils/format';
import { occurrencesFor } from '../services/routineService';
import { GaryError, runGaryTurn, type ApiMessage } from '../services/gary/client';
import { buildSystemPrompt } from '../services/gary/prompt';
import type { GaryDataContext, GaryEffect } from '../services/gary/tools';
import { garyStrings, readYesNo, speechLocale } from '../services/gary/text';
import {
  ListenError,
  canListen,
  canSpeak,
  listen,
  loadVoices,
  pickVoice,
  speak,
  stopSpeaking,
  type ListenHandle,
} from '../services/gary/speech';

export type GaryStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface GaryTurn {
  id: string;
  from: 'person' | 'gary';
  text: string;
  effects: GaryEffect[];
  /** Shown in the clay error style rather than as a normal reply. */
  isError?: boolean;
}

export interface PendingConfirmation {
  routineId: string;
}

/**
 * Everything Gary does, in one place: listening, asking Claude, running the
 * tools against live data, speaking, and the Yes/No confirmation.
 *
 * Lives above the overlay, so closing Gary to look at a memory and opening him
 * again keeps the conversation.
 */
export function useGary(open: boolean) {
  const data = useAppData();
  const { gary: setup, settings, actions } = data;
  const language = setup.language;
  const text = garyStrings(language);

  const [turns, setTurns] = useState<GaryTurn[]>([]);
  const [status, setStatus] = useState<GaryStatus>('idle');
  const [interim, setInterim] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  /** A one-off message about the last attempt to listen. Cleared on the next try. */
  const [hint, setHint] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>(undefined);
  const [voicesChecked, setVoicesChecked] = useState(false);

  const history = useRef<ApiMessage[]>([]);
  const listening = useRef<ListenHandle | null>(null);
  const inFlight = useRef<AbortController | null>(null);
  /** Set when the person taps Stop, so a cut-off reply does not start the mic. */
  const interrupted = useRef(false);
  /** Bumped on close, so late async work from an old session is ignored. */
  const session = useRef(0);
  /** Bumped for every utterance Gary starts, so only the newest one may start the mic. */
  const speechTurn = useRef(0);

  // Tools read the latest data at the moment they run, not at render time.
  const latest = useRef(data);
  const pendingRef = useRef(pending);
  useEffect(() => {
    latest.current = data;
    pendingRef.current = pending;
  });

  const getContext = useCallback(
    (): GaryDataContext => ({
      date: today(),
      now: new Date(),
      routines: latest.current.routines,
      completions: latest.current.completions,
      memories: latest.current.memories,
      family: latest.current.family,
    }),
    [],
  );

  const configured = setup.apiKey.trim().length > 0;
  const listenSupported = useMemo(canListen, []);

  // Pick a voice whenever the language changes.
  useEffect(() => {
    let cancelled = false;
    setVoicesChecked(false);
    loadVoices().then((voices) => {
      if (cancelled) return;
      setVoice(pickVoice(voices, speechLocale(language)));
      setVoicesChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const hasVoice = canSpeak() && voice !== undefined;

  // Standing notices: no microphone, or no voice for the chosen language.
  useEffect(() => {
    if (!listenSupported) setNotice(text.noMic);
    else if (voicesChecked && !hasVoice) setNotice(text.noVoice);
    else setNotice(null);
  }, [listenSupported, voicesChecked, hasVoice, text]);

  const addTurn = useCallback((turn: Omit<GaryTurn, 'id'>) => {
    setTurns((current) => [...current, { ...turn, id: createId('gt') }]);
  }, []);

  const stopEverything = useCallback(() => {
    interrupted.current = true;
    speechTurn.current += 1;
    listening.current?.cancel();
    listening.current = null;
    inFlight.current?.abort();
    inFlight.current = null;
    stopSpeaking();
    setInterim('');
    setStatus('idle');
  }, []);

  // Closing Gary stops the mic, the voice and any request in progress.
  useEffect(() => {
    if (!open) {
      session.current += 1;
      stopEverything();
    }
  }, [open, stopEverything]);

  useEffect(() => () => stopEverything(), [stopEverything]);

  /* ---------------------------------------------------------------- */

  // `startListening` and `say` call each other (Gary asks, then listens), so
  // the listener is reached through a ref.
  const startListeningRef = useRef<() => void>(() => {});

  const say = useCallback(
    async (reply: string, thenListen: boolean) => {
      const mine = session.current;
      speechTurn.current += 1;
      const myTurn = speechTurn.current;
      interrupted.current = false;
      setStatus('speaking');
      const spoke = await speak(reply, voice, speechLocale(language));
      // A newer reply, a Stop or a close cut this one off: it no longer owns the screen.
      if (mine !== session.current || myTurn !== speechTurn.current) return;
      setStatus('idle');
      // Listen again only after a question, only once, and never after Stop.
      if (spoke && thenListen && !interrupted.current && listenSupported) {
        startListeningRef.current();
      }
    },
    [voice, language, listenSupported],
  );

  const resolveConfirmation = useCallback(
    (answer: 'yes' | 'no') => {
      const current = pendingRef.current;
      if (!current) return;
      // Cleared at once, so a double tap cannot answer the same card twice.
      pendingRef.current = null;
      setPending(null);

      const context = getContext();
      const occurrence = occurrencesFor(context.routines, context.completions, context.date).find(
        (o) => o.routine.id === current.routineId,
      );
      if (!occurrence) return;
      const name = occurrence.routine.name;

      let reply: string;
      let note: string;
      if (answer === 'yes') {
        // Toggling an already-complete routine would undo it, so check first.
        if (occurrence.completed) {
          reply = text.alreadyDone(name);
          note = `"${name}" was already marked complete.`;
        } else {
          actions.toggleRoutine(occurrence.routine.id, context.date);
          reply = text.markedDone(name);
          note = `The person confirmed. "${name}" is now marked complete for today.`;
        }
      } else {
        reply = text.notChanged;
        note = `The person said no. "${name}" was not changed.`;
      }

      // Recorded as a plain exchange so Gary knows the outcome next time.
      history.current = [
        ...history.current,
        { role: 'user', content: `(App note: ${note})` },
        { role: 'assistant', content: reply },
      ];
      addTurn({
        from: 'gary',
        text: reply,
        effects: [{ kind: 'routine', routineId: occurrence.routine.id }],
      });
      void say(reply, false);
    },
    [actions, addTurn, getContext, say, text],
  );

  const ask = useCallback(
    async (utterance: string) => {
      const words = utterance.trim();
      if (!words) return;
      setHint(null);
      // Typing or tapping a starter while the mic is open replaces what it would hear.
      listening.current?.cancel();
      listening.current = null;

      // A short spoken yes/no answers the card directly, without the model.
      if (pendingRef.current) {
        const answer = readYesNo(words);
        if (answer) {
          addTurn({ from: 'person', text: words, effects: [] });
          resolveConfirmation(answer);
          return;
        }
      }

      addTurn({ from: 'person', text: words, effects: [] });

      if (!configured) {
        addTurn({ from: 'gary', text: text.errors.no_key, effects: [], isError: true });
        return;
      }

      const mine = session.current;
      const controller = new AbortController();
      inFlight.current = controller;
      setStatus('thinking');

      try {
        const context = getContext();
        const result = await runGaryTurn({
          apiKey: setup.apiKey,
          model: setup.model,
          system: buildSystemPrompt({
            language,
            addressAs: setup.addressAs,
            userName: settings.name,
            date: context.date,
            now: context.now,
          }),
          history: history.current,
          utterance: words,
          getContext,
          signal: controller.signal,
        });
        if (mine !== session.current) return;

        history.current = result.messages;
        const reply = result.text || text.emptyReply;

        // The latest proposal replaces any older card.
        const proposal = [...result.effects].reverse().find((e) => e.kind === 'confirmDone');
        const nextPending =
          proposal && proposal.kind === 'confirmDone' ? { routineId: proposal.routineId } : null;
        pendingRef.current = nextPending;
        setPending(nextPending);

        addTurn({ from: 'gary', text: reply, effects: result.effects });
        const asksSomething = /[?？]\s*$/.test(reply) || Boolean(proposal);
        void say(reply, asksSomething);
      } catch (error) {
        if (mine !== session.current || controller.signal.aborted) return;
        const code = error instanceof GaryError ? error.code : 'unknown';
        addTurn({ from: 'gary', text: text.errors[code], effects: [], isError: true });
        setStatus('idle');
      } finally {
        if (inFlight.current === controller) inFlight.current = null;
      }
    },
    [addTurn, configured, getContext, language, resolveConfirmation, say, settings.name, setup, text],
  );

  const startListening = useCallback(() => {
    if (!listenSupported) return;
    speechTurn.current += 1;
    stopSpeaking();
    listening.current?.cancel();

    const mine = session.current;
    setHint(null);
    const handle = listen(speechLocale(language), setInterim);
    listening.current = handle;
    setInterim('');
    setStatus('listening');

    handle.result
      .then((heard) => {
        if (mine !== session.current) return;
        setInterim('');
        void ask(heard);
      })
      .catch((error: unknown) => {
        if (mine !== session.current) return;
        const reason = error instanceof ListenError ? error.reason : 'no_speech';
        // Cancelled on purpose (Stop, a typed message, or a fresh listen): whoever
        // cancelled it already owns the status.
        if (reason === 'aborted') return;
        setInterim('');
        setStatus('idle');
        if (reason === 'denied') setHint(text.micDenied);
        else if (reason === 'network') addTurn({ from: 'gary', text: text.errors.network, effects: [], isError: true });
        else if (reason === 'no_speech') setHint(text.didNotHear);
      })
      .finally(() => {
        if (listening.current === handle) listening.current = null;
      });
  }, [addTurn, ask, language, listenSupported, text]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // The first time Gary opens, he says hello. He does not start listening on
  // his own: the person taps the button when they are ready.
  const greeted = useRef(false);
  useEffect(() => {
    if (!open || greeted.current || !voicesChecked) return;
    greeted.current = true;
    const hello = text.greeting(setup.addressAs.trim() || settings.name.split(' ')[0] || '');
    addTurn({ from: 'gary', text: hello, effects: [] });
    if (configured) void say(hello, false);
  }, [open, voicesChecked, text, setup.addressAs, settings.name, addTurn, configured, say]);

  /** The one big button: listen, stop listening, or stop talking. */
  const tapMic = useCallback(() => {
    if (status === 'listening') {
      listening.current?.stop();
      return;
    }
    if (status === 'speaking' || status === 'thinking') {
      stopEverything();
      return;
    }
    startListening();
  }, [startListening, status, stopEverything]);

  const setLanguage = useCallback(
    (next: GaryLanguage) => {
      if (next === language) return;
      stopEverything();
      actions.updateGarySettings({ language: next });
    },
    [actions, language, stopEverything],
  );

  /** A large on-screen button, such as "I have done this" on a routine card. */
  const proposeDone = useCallback(
    (routineId: string) => {
      const routine = latest.current.routines.find((r) => r.id === routineId);
      if (!routine) return;
      stopEverything();
      setPending({ routineId });
      pendingRef.current = { routineId };
      const question = text.confirmQuestion(routine.name);
      addTurn({ from: 'gary', text: question, effects: [] });
      void say(question, true);
    },
    [addTurn, say, stopEverything, text],
  );

  return {
    text,
    language,
    configured,
    listenSupported,
    turns,
    status,
    interim,
    notice,
    hint,
    pending,
    tapMic,
    ask,
    confirm: resolveConfirmation,
    proposeDone,
    setLanguage,
    stop: stopEverything,
  };
}

export type GaryController = ReturnType<typeof useGary>;
