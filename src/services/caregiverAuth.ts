import type { Caregiver, CaregiverSession, Settings } from '../types';

/**
 * Caregiver sign-in.
 *
 * The person being cared for issues an access code from Caregiver Access and
 * passes it to their caregiver along with the email already on the record. The
 * caregiver signs in with those two, and from then on sees only what that
 * caregiver's own permissions allow.
 *
 * HOW REAL IS THIS: it is a genuine credential check with a genuine session -
 * a wrong code is refused, a revoked code stops working, and a paused caregiver
 * is turned away. It is NOT server authentication. There is no account service
 * in this version, so the check runs against records held on the same device.
 * It keeps an honest caregiver inside their permissions; it cannot stop someone
 * with physical access to the device's storage. Moving to a real backend means
 * replacing this file's three functions with API calls and leaving every caller
 * untouched.
 */

/** Ambiguous characters are left out so a code can be read aloud over a phone. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

export function generateAccessCode(): string {
  const values = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join('');
}

export type SignInFailure = 'invalid' | 'paused' | 'sharing-off';

export type SignInResult =
  | { ok: true; session: CaregiverSession }
  | { ok: false; reason: SignInFailure };

function normaliseCode(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Verifies an email and access code against the caregivers on record.
 *
 * "Not found" and "wrong code" deliberately return the same failure, so the
 * screen cannot be used to discover which emails exist.
 */
export function signIn(
  email: string,
  code: string,
  caregivers: Caregiver[],
  settings: Settings,
): SignInResult {
  const wantedEmail = email.trim().toLowerCase();
  const wantedCode = normaliseCode(code);

  if (!wantedEmail || wantedCode.length === 0) return { ok: false, reason: 'invalid' };

  const caregiver = caregivers.find(
    (entry) =>
      entry.email.trim().toLowerCase() === wantedEmail &&
      entry.accessCode !== undefined &&
      normaliseCode(entry.accessCode) === wantedCode,
  );

  if (!caregiver) return { ok: false, reason: 'invalid' };

  // A correct code still does not get in if access has been withdrawn.
  if (!settings.sharingEnabled) return { ok: false, reason: 'sharing-off' };
  if (!caregiver.active) return { ok: false, reason: 'paused' };

  return {
    ok: true,
    session: { caregiverId: caregiver.id, signedInAt: new Date().toISOString() },
  };
}

/**
 * Re-checks a stored session against the current records on every read, so
 * revoking a code or pausing a caregiver takes effect immediately rather than
 * at the next sign-in.
 */
export function resolveSession(
  session: CaregiverSession | null,
  caregivers: Caregiver[],
  settings: Settings,
): Caregiver | null {
  if (!session) return null;

  const caregiver = caregivers.find((entry) => entry.id === session.caregiverId);
  if (!caregiver) return null;
  if (!caregiver.accessCode) return null;
  if (!caregiver.active) return null;
  if (!settings.sharingEnabled) return null;

  return caregiver;
}
