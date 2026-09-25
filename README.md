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

No backend, no authentication, no real notifications, no cloud sync. The seams
for each of those are in `services/`.
