import { describe, expect, it } from "vitest";
import { matchLocale } from "@/lib/accept-language";

describe("matchLocale", () => {
  it("falls back to English when the header is missing or empty", () => {
    expect(matchLocale(null)).toBe("en");
    expect(matchLocale(undefined)).toBe("en");
    expect(matchLocale("")).toBe("en");
  });

  it("matches a bare language tag", () => {
    expect(matchLocale("fr")).toBe("fr");
    expect(matchLocale("ja")).toBe("ja");
  });

  // The regression this function exists for: real browsers send region-qualified,
  // weighted tags, which a plain list comparison never matches.
  it("matches what browsers actually send", () => {
    expect(matchLocale("fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7")).toBe("fr");
    expect(matchLocale("ja-JP,ja;q=0.9,en;q=0.8")).toBe("ja");
    expect(matchLocale("en-US,en;q=0.9")).toBe("en");
  });

  it("falls back to the primary subtag of an unknown region", () => {
    expect(matchLocale("fr-CA")).toBe("fr");
    expect(matchLocale("fr-BE")).toBe("fr");
  });

  it("honours quality ordering rather than header order", () => {
    expect(matchLocale("en;q=0.4,ja;q=0.9")).toBe("ja");
    expect(matchLocale("fr;q=0.1,ja;q=0.2")).toBe("ja");
  });

  it("skips unsupported languages and takes the next supported one", () => {
    expect(matchLocale("de-DE,de;q=0.9,fr;q=0.5")).toBe("fr");
    expect(matchLocale("de-DE,de;q=0.9")).toBe("en");
  });

  it("ignores wildcards and explicitly refused languages", () => {
    expect(matchLocale("*")).toBe("en");
    expect(matchLocale("fr;q=0")).toBe("en");
    expect(matchLocale("fr;q=0,ja;q=0.5")).toBe("ja");
  });

  it("tolerates whitespace and casing", () => {
    expect(matchLocale("FR-FR, fr;q=0.9")).toBe("fr");
    expect(matchLocale("  ja-JP  ")).toBe("ja");
  });

  it("does not crash on malformed quality values", () => {
    expect(matchLocale("fr;q=abc")).toBe("en");
    expect(matchLocale("fr;q=abc,ja")).toBe("ja");
  });
});
