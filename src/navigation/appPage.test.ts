import { afterEach, describe, expect, it } from "vitest";
import { clearStoredAppPage, DEFAULT_APP_PAGE, readStoredAppPage, writeStoredAppPage } from "./appPage";

const memory = new Map<string, string>();

const sessionStorageMock = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value); },
  removeItem: (key: string) => { memory.delete(key); },
  clear: () => { memory.clear(); },
};

Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: sessionStorageMock,
});

describe("appPage storage", () => {
  afterEach(() => {
    memory.clear();
  });

  it("returns the default page when nothing is stored", () => {
    expect(readStoredAppPage()).toBe(DEFAULT_APP_PAGE);
  });

  it("persists a known page and ignores unknown values", () => {
    writeStoredAppPage("Movimientos");
    expect(readStoredAppPage()).toBe("Movimientos");
    writeStoredAppPage("not-a-page");
    expect(readStoredAppPage()).toBe("Movimientos");
    writeStoredAppPage("Balances:USD");
    expect(readStoredAppPage()).toBe("Balances:USD");
  });

  it("clears the stored page", () => {
    writeStoredAppPage("Cuentas");
    clearStoredAppPage();
    expect(readStoredAppPage()).toBe(DEFAULT_APP_PAGE);
  });
});
