import { describe, expect, it } from "vitest";
import { shouldSkipProfileHydration } from "./authSession";

describe("shouldSkipProfileHydration", () => {
  it("hydrates the first session for a user", () => {
    expect(shouldSkipProfileHydration("INITIAL_SESSION", null, "user-1")).toBe(false);
    expect(shouldSkipProfileHydration("BOOTSTRAP", null, "user-1")).toBe(false);
    expect(shouldSkipProfileHydration("SIGNED_IN", null, "user-1")).toBe(false);
  });

  it("skips token refresh and same-user tab recovery", () => {
    expect(shouldSkipProfileHydration("TOKEN_REFRESHED", "user-1", "user-1")).toBe(true);
    expect(shouldSkipProfileHydration("SIGNED_IN", "user-1", "user-1")).toBe(true);
    expect(shouldSkipProfileHydration("INITIAL_SESSION", "user-1", "user-1")).toBe(true);
    expect(shouldSkipProfileHydration("USER_UPDATED", "user-1", "user-1")).toBe(true);
  });

  it("hydrates again when the authenticated user changes", () => {
    expect(shouldSkipProfileHydration("SIGNED_IN", "user-1", "user-2")).toBe(false);
    expect(shouldSkipProfileHydration("TOKEN_REFRESHED", "user-1", "user-2")).toBe(false);
  });

  it("does not skip sign-out", () => {
    expect(shouldSkipProfileHydration("SIGNED_OUT", "user-1", null)).toBe(false);
  });
});
