import type { Caregiver, CaregiverPermissions, LocationFix, LocationState, Settings } from '../types';

/**
 * Authorization for anything a caregiver can see.
 *
 * IMPORTANT, AND NOT A DETAIL: DailyMind has no server and no accounts. Every
 * check in this file runs on the same device that holds the data, so it is an
 * enforcement point for the *product*, not a security boundary. Anyone who can
 * open this device's browser storage can read the position regardless of what
 * these functions return. Real protection needs the identical check to run
 * server-side, behind an authenticated session, before the data is ever sent.
 *
 * This module is written as that future endpoint so the move is mechanical:
 * `authorizeLocationRead` is exactly the body of
 * `GET /api/caregiver/users/:userId/location`, and it is the only way any
 * screen is allowed to reach a stored position.
 */

export type DenialReason =
  | 'unknown-caregiver'
  | 'caregiver-inactive'
  | 'sharing-paused'
  | 'permission-off'
  | 'not-sharing';

export type AccessDecision =
  | { allowed: true; caregiver: Caregiver }
  | { allowed: false; reason: DenialReason; caregiver?: Caregiver };

export interface AccessInput {
  caregiverId: string;
  caregivers: Caregiver[];
  settings: Settings;
}

/**
 * Whether this caregiver may see `permission` at all. Four gates, and all four
 * have to pass: the caregiver must exist, be active, the account-wide sharing
 * switch must be on, and that specific permission must be granted.
 */
export function canAccess(
  input: AccessInput,
  permission: keyof CaregiverPermissions,
): AccessDecision {
  const caregiver = input.caregivers.find((entry) => entry.id === input.caregiverId);

  if (!caregiver) return { allowed: false, reason: 'unknown-caregiver' };
  if (!input.settings.sharingEnabled) return { allowed: false, reason: 'sharing-paused', caregiver };
  if (!caregiver.active) return { allowed: false, reason: 'caregiver-inactive', caregiver };
  if (!caregiver.permissions[permission]) {
    return { allowed: false, reason: 'permission-off', caregiver };
  }

  return { allowed: true, caregiver };
}

export type LocationReadResult =
  | { status: 'ok'; fix: LocationFix; caregiver: Caregiver }
  | { status: 'denied'; reason: DenialReason; caregiver?: Caregiver }
  | { status: 'no-fix'; caregiver: Caregiver };

/**
 * The only supported way to read someone's position on behalf of a caregiver.
 * Screens must not touch `location.lastFix` directly.
 */
export function authorizeLocationRead(
  input: AccessInput,
  location: LocationState,
): LocationReadResult {
  const decision = canAccess(input, 'location');
  if (!decision.allowed) {
    return { status: 'denied', reason: decision.reason, caregiver: decision.caregiver };
  }

  // Permission alone is not enough: the person also has to be sharing right now.
  if (!location.sharingEnabled) {
    return { status: 'denied', reason: 'not-sharing', caregiver: decision.caregiver };
  }

  if (!location.lastFix) return { status: 'no-fix', caregiver: decision.caregiver };

  return { status: 'ok', fix: location.lastFix, caregiver: decision.caregiver };
}

/** Caregivers who are switched on and allowed to see the position right now. */
export function caregiversWithLocationAccess(
  caregivers: Caregiver[],
  settings: Settings,
): Caregiver[] {
  if (!settings.sharingEnabled) return [];
  return caregivers.filter((caregiver) => caregiver.active && caregiver.permissions.location);
}
