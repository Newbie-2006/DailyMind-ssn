import type { GaryLanguage } from '../../types';

/**
 * Every fixed thing Gary shows or says, in both languages.
 *
 * The Tamil here is everyday spoken Tamil in Tamil script, and it has not yet
 * been reviewed by a native speaker. Treat it as a first draft: changing a
 * string here changes it everywhere.
 */
export interface GaryStrings {
  title: string;
  launch: string;
  languageLabel: string;
  close: string;
  tapToSpeak: string;
  listening: string;
  thinking: string;
  speaking: string;
  micLabel: string;
  stopLabel: string;
  typeInstead: string;
  typePlaceholder: string;
  send: string;
  starters: string[];
  greeting(name: string): string;
  confirmQuestion(routine: string): string;
  yes: string;
  no: string;
  markedDone(routine: string): string;
  alreadyDone(routine: string): string;
  notChanged: string;
  openMemory: string;
  doneLabel: string;
  laterLabel: string;
  missedLabel: string;
  nothingToday: string;
  nextUp: string;
  markDone: string;
  emptyReply: string;
  needsSetup: string;
  needsSetupBody: string;
  openSetup: string;
  noVoice: string;
  noMic: string;
  micDenied: string;
  didNotHear: string;
  errors: Record<GaryErrorCode, string>;
}

export type GaryErrorCode =
  | 'no_key'
  | 'invalid_key'
  | 'rate_limited'
  | 'overloaded'
  | 'network'
  | 'timeout'
  | 'unknown';

const en: GaryStrings = {
  title: 'Gary',
  launch: 'Talk to Gary',
  languageLabel: 'Language',
  close: 'Close Gary',
  tapToSpeak: 'Tap and speak',
  listening: 'Listening…',
  thinking: 'Gary is thinking…',
  speaking: 'Gary is speaking. Tap to stop.',
  micLabel: 'Speak to Gary',
  stopLabel: 'Stop',
  typeInstead: 'Type instead',
  typePlaceholder: 'Type to Gary…',
  send: 'Send',
  starters: ['What do I have today?', 'Show me my memories', 'Who is in my family?'],
  greeting: (name) =>
    `Hello${name ? ` ${name}` : ''}. I am Gary. You can ask me about today, your photos, or your family.`,
  confirmQuestion: (routine) => `Shall I mark "${routine}" as done?`,
  yes: 'Yes',
  no: 'No',
  markedDone: (routine) => `Done. I have marked ${routine} as complete.`,
  alreadyDone: (routine) => `${routine} is already marked complete.`,
  notChanged: 'All right, I have left it as it is.',
  openMemory: 'Open this memory',
  doneLabel: 'Done',
  laterLabel: 'Later today',
  missedLabel: 'Not done yet',
  nothingToday: 'Nothing is planned for today.',
  nextUp: 'Next',
  markDone: 'I have done this',
  emptyReply: 'Sorry, I could not answer that one. Could you say it another way?',
  needsSetup: 'Gary is not set up yet',
  needsSetupBody: 'A family member needs to add Gary’s key in Profile, under Gary voice assistant.',
  openSetup: 'Set up Gary',
  noVoice: 'This browser has no voice for this language, so Gary will show his answers as text.',
  noMic: 'This browser cannot listen. You can type to Gary instead.',
  micDenied: 'The microphone is turned off for this app. You can allow it in the browser settings, or type instead.',
  didNotHear: 'I did not catch that. Tap the button and try again.',
  errors: {
    no_key: 'Gary is not set up yet. Please ask a family member.',
    invalid_key: 'Gary’s key is not working. Please ask a family member to check it.',
    rate_limited: 'Gary needs a short rest. Please try again in a minute.',
    overloaded: 'Gary is very busy just now. Please try again in a moment.',
    network: 'Gary cannot reach the internet. Please check the connection.',
    timeout: 'Gary took too long to answer. Please try again.',
    unknown: 'Something went wrong. Please try again.',
  },
};

const ta: GaryStrings = {
  title: 'Gary',
  launch: 'Gary கிட்ட பேசு',
  languageLabel: 'மொழி',
  close: 'Gary-ஐ மூடு',
  tapToSpeak: 'தட்டிப் பேசுங்கள்',
  listening: 'கேட்கிறேன்…',
  thinking: 'யோசிக்கிறேன்…',
  speaking: 'பேசுகிறேன். நிறுத்த தட்டுங்கள்.',
  micLabel: 'Gary-இடம் பேசுங்கள்',
  stopLabel: 'நிறுத்து',
  typeInstead: 'எழுதிக் கேளுங்கள்',
  typePlaceholder: 'Gary-க்கு எழுதுங்கள்…',
  send: 'அனுப்பு',
  starters: ['இன்னிக்கு என்ன வேலை இருக்கு?', 'என் photos-ஐ காட்டு', 'என் குடும்பத்துல யாரு?'],
  greeting: (name) =>
    `வணக்கம்${name ? ` ${name}` : ''}. நான் Gary. இன்னிக்கு வேலை, உங்க photos, குடும்பம் பத்தி என்கிட்ட கேளுங்க.`,
  confirmQuestion: (routine) => `"${routine}" முடிஞ்சதுன்னு குறிக்கட்டுமா?`,
  yes: 'ஆமா',
  no: 'வேண்டாம்',
  markedDone: (routine) => `சரி, ${routine} முடிஞ்சதுன்னு குறிச்சிட்டேன்.`,
  alreadyDone: (routine) => `${routine} ஏற்கனவே முடிஞ்சதுன்னு குறிச்சிருக்கு.`,
  notChanged: 'சரி, அப்படியே விட்டுட்டேன்.',
  openMemory: 'இந்த நினைவைத் திற',
  doneLabel: 'முடிஞ்சது',
  laterLabel: 'இன்னும் நேரம் இருக்கு',
  missedLabel: 'இன்னும் செய்யல',
  nothingToday: 'இன்னிக்கு எந்த வேலையும் இல்ல.',
  nextUp: 'அடுத்தது',
  markDone: 'இதை செஞ்சிட்டேன்',
  emptyReply: 'மன்னிக்கணும், அதுக்கு பதில் சொல்ல முடியல. வேற மாதிரி சொல்லுங்களேன்?',
  needsSetup: 'Gary இன்னும் அமைக்கப்படல',
  needsSetupBody: 'குடும்பத்துல ஒருத்தர் Profile-ல Gary voice assistant-ல key சேர்க்கணும்.',
  openSetup: 'Gary-ஐ அமை',
  noVoice: 'இந்த browser-ல தமிழ் குரல் இல்ல. அதனால Gary பதிலை எழுத்தா காட்டுவார்.',
  noMic: 'இந்த browser-ஆல கேட்க முடியாது. எழுதிக் கேளுங்கள்.',
  micDenied: 'Microphone அனுமதி இல்ல. Browser settings-ல அனுமதிக்கலாம், இல்லன்னா எழுதிக் கேளுங்க.',
  didNotHear: 'சரியா கேக்கல. மறுபடி தட்டிப் பேசுங்க.',
  errors: {
    no_key: 'Gary இன்னும் அமைக்கப்படல. குடும்பத்துல ஒருத்தர்கிட்ட கேளுங்க.',
    invalid_key: 'Gary-யோட key வேலை செய்யல. குடும்பத்துல ஒருத்தர்கிட்ட சரிபார்க்கச் சொல்லுங்க.',
    rate_limited: 'Gary-க்கு கொஞ்சம் ஓய்வு வேணும். ஒரு நிமிஷம் கழிச்சு முயற்சி பண்ணுங்க.',
    overloaded: 'Gary இப்ப ரொம்ப பிஸி. கொஞ்ச நேரம் கழிச்சு முயற்சி பண்ணுங்க.',
    network: 'Internet இணைப்பு இல்ல. Connection-ஐ சரிபாருங்க.',
    timeout: 'பதில் வர ரொம்ப நேரம் ஆச்சு. மறுபடி முயற்சி பண்ணுங்க.',
    unknown: 'ஏதோ தப்பாயிடுச்சு. மறுபடி முயற்சி பண்ணுங்க.',
  },
};

export function garyStrings(language: GaryLanguage): GaryStrings {
  return language === 'ta' ? ta : en;
}

/** BCP-47 tags for the browser's speech recognition and voices. */
export function speechLocale(language: GaryLanguage): string {
  return language === 'ta' ? 'ta-IN' : 'en-IN';
}

const YES_WORDS = [
  'yes', 'yeah', 'yep', 'ok', 'okay', 'sure', 'haan',
  'aama', 'aamaa', 'ama', 'amam', 'seri', 'sari',
  'ஆமா', 'ஆமாம்', 'ஆம்', 'சரி', 'ஓகே', 'ஓக்கே', 'எஸ்',
];

const NO_WORDS = [
  'no', 'nope', 'not', "don't", 'dont', 'wait',
  'illa', 'illai', 'vendam', 'venam', 'vendaam',
  'இல்லை', 'இல்ல', 'வேண்டாம்', 'வேணாம்', 'நோ', 'இன்னும்',
];

/**
 * Reads a short spoken reply to a Yes/No card. Anything longer than a few
 * words, or containing both a yes and a no, is left for Gary to understand,
 * because a misheard "yes" must never change someone's record.
 */
export function readYesNo(utterance: string): 'yes' | 'no' | null {
  const words = utterance
    .toLowerCase()
    .replace(/[.,!?।"'“”]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0 || words.length > 4) return null;

  const saysYes = words.some((word) => YES_WORDS.includes(word));
  const saysNo = words.some((word) => NO_WORDS.includes(word));
  if (saysYes === saysNo) return null;
  return saysYes ? 'yes' : 'no';
}
