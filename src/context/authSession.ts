import type { AuthChangeEvent } from "@supabase/supabase-js";

export type AuthSessionEvent = AuthChangeEvent | "BOOTSTRAP";

/**
 * Token refresh and same-user visibility recovery must not re-run profile
 * hydration. Doing so remounts the authenticated tree and flashes Complete Profile.
 */
export function shouldSkipProfileHydration(
  event: AuthSessionEvent,
  previousUserId: string | null,
  nextUserId: string | null,
): boolean {
  if (!nextUserId || !previousUserId || previousUserId !== nextUserId) return false;
  return event === "TOKEN_REFRESHED"
    || event === "USER_UPDATED"
    || event === "SIGNED_IN"
    || event === "INITIAL_SESSION"
    || event === "PASSWORD_RECOVERY";
}
