# DailyMind

**Remember. Plan. Live Better.**

A personal memory and routine companion, built mobile-first for a phone and
pleasant to use on a desktop browser. Version 1 runs entirely in the browser:
realistic sample content, local persistence, and a mock assistant sitting behind
a provider interface so a real model can be dropped in later.

## Running it

```bash
npm install
npm run dev
```

The dev server binds to every interface, so it prints a `Network:` address as
well as `localhost`.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 5173 |
| `npm run build` | Typecheck (`tsc -b`) then production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | oxlint |

## Testing on a Samsung Galaxy A15 5G

Two options, both of which give a real touch device rather than an emulated one.

**USB debugging (works without shared Wi-Fi):**

1. On the phone, enable Developer options, then USB debugging.
2. Connect it and accept the debugging prompt.
3. In desktop Chrome, open `chrome://inspect/#devices` and confirm the device
   appears.
4. Under **Port forwarding**, map `5173` to `localhost:5173` and tick *Enable
   port forwarding*.
5. Open `http://localhost:5173` on the phone.

**Same Wi-Fi:** open the `Network:` URL that `npm run dev` prints. Windows
Firewall may need to allow Node on the private network the first time.

Either way, the app installs nothing and keeps its data in that browser's
storage.

## How it is put together

```
src/
├── assets/photos/     Bundled photography
├── components/        Reusable UI; ui/ holds the primitives
├── data/              Sample content and static option lists
├── hooks/             The app-wide data context and its consumers
├── layouts/           The phone shell
├── pages/             One file per screen
├── services/          Business logic, storage, the assistant provider
├── types/             Shared types
└── utils/             Dates, formatting, image downscaling
```

The rule the code follows: **screens render, services decide, and only
`services/storage.ts` touches the browser.** A screen never reads
`localStorage`, and the logic that computes progress, insights and assistant
replies is plain TypeScript with no React in it, so it can be reused or tested
on its own.

### Data and persistence

`AppDataProvider` reads once at startup and writes each slice back as it
changes. Memories, routines, completions, reminders, settings and caregiver
permissions all survive a refresh. Storage is namespaced and versioned
(`dailymind.v1.*`), and falls back to memory when the browser blocks it, so
private windows do not break the app.

Photos a person adds are downscaled to 1200px and re-encoded before being
stored, because a phone camera file is larger than the whole storage quota.

### The assistant

`assistantService.ts` defines an `AssistantProvider` interface and ships one
implementation, `MockAssistantProvider`, which answers from the real routine and
memory data it is handed — what is left today, what happened yesterday, how the
week compares, memory search, and a graceful fallback. Swapping in a real model
means writing one more class that satisfies the same interface; no screen
changes.

### Gary, the voice assistant

Gary is a voice-first companion for the person DailyMind belongs to. A large
**Talk to Gary** button sits on every screen and opens a full-screen view with
one big microphone button, an EN / தமிழ் switch, and large cards for whatever
Gary is talking about.

**Set up (by a family member):** Profile → *Gary voice assistant*. Add an
Anthropic API key, choose the default language (English or Tamil) and how Gary
addresses the person (Paati, Thaatha, Amma…). Then add people under Profile →
*Family details* so Gary can answer "what is my daughter's name?".

How it is put together, in `services/gary/`:

| File | Job |
| --- | --- |
| `tools.ts` | The only way Gary learns or does anything: today's schedule, next routine, memory search, open a memory, family lookup, and *propose* marking a routine done. Each returns facts from real data and may ask the screen to show a card. |
| `prompt.ts` | Gary's standing rules: short spoken answers, one question at a time, never scold, never invent a name or a detail, medicine exactly as saved. |
| `client.ts` | Calls the Claude Messages API from the browser, runs the tool loop, trims history, maps errors, and applies a local rate limit. |
| `speech.ts` | The browser's speech recognition and voices (`en-IN`, `ta-IN`). |
| `text.ts` | Every fixed string in English and Tamil, and the yes/no reader. |

`hooks/useGary.ts` ties these together, and `components/gary/` holds the
button, the view and the cards.

**Gary never changes data on his own.** Marking a routine done shows a Yes/No
card; the app (not the model) marks it only after a tap on *Yes* or a short
spoken "yes" / "ஆமா". A routine already done is never toggled back.

**Known limits**

- Voice works in Chrome, Edge and Samsung Internet. Recognition does not work
  inside the Capacitor Android app yet; there Gary falls back to typing.
- Some browsers, desktop Chrome in particular, may have no Tamil voice. Gary
  then shows his reply as text and says so.
- The Tamil strings in `text.ts` are a first draft and need review by a native
  speaker.
- The API key is stored in this browser's storage and sent straight to
  Anthropic. That is acceptable for a personal device the family trusts; it is
  **not** safe for a published app, which would need a small server to hold the
  key and rate-limit per person. Use a key with a spending limit.
- Routines, memory notes and family details needed for an answer are sent to
  Anthropic. Photos are not.

### Insights

Observations describe the log and nothing else. Totals count only days that have
already happened, so a Thursday is never reported as a week of missed routines.
The language is deliberately non-clinical: *"this activity was missed more
often"*, never a claim about anyone's health.

### Memory to action

When a memory has an anniversary coming up, DailyMind says so and offers a
reminder. It never creates one on its own — the person confirms in a dialog
first. That pattern is the product, not a detail.

## Accessibility

Touch targets are 44px or larger, status is never carried by colour alone
(completed routines get a tick and a strikethrough; toggles get a tick and a
position), forms are labelled, dialogs trap focus and close on Escape, and all
motion respects `prefers-reduced-motion`.

## What is deliberately not here

No backend, no authentication, no real notifications, no cloud sync (Gary talks
to Anthropic directly, see above). The seams
for each of those are in `services/`.
