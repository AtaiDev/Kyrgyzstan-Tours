import { describe, expect, it } from "vitest";

import { dictionaries, en } from "./dictionaries";
import { stripLanguagePrefix, withLanguage } from "./languages";
import { createTranslator, interpolate } from "./translate";

describe("interpolate", () => {
  it("replaces known variables and keeps unknown placeholders", () => {
    expect(interpolate("Day {day} of {total}", { day: 2 })).toBe("Day 2 of {total}");
  });
});

describe("createTranslator", () => {
  it("uses Russian plural categories", () => {
    const { plural } = createTranslator("ru", dictionaries.ru, en);
    expect(plural("days", 1)).toBe("1 день");
    expect(plural("days", 3)).toBe("3 дня");
    expect(plural("days", 5)).toBe("5 дней");
    expect(plural("days", 21)).toBe("21 день");
  });

  it("prefers administrator overrides", () => {
    const { t } = createTranslator("ky", dictionaries.ky, en, { "nav.tours": "Турлар" });
    expect(t("nav.tours")).toBe("Турлар");
    expect(t("nav.guides")).toBe("Гиддер");
  });

  it("has every message in every language", () => {
    const keys = Object.keys(en.messages);
    for (const dictionary of Object.values(dictionaries)) {
      expect(Object.keys(dictionary.messages).sort()).toEqual([...keys].sort());
      for (const key of keys) {
        expect(dictionary.messages[key as keyof typeof en.messages].trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("language paths", () => {
  it("adds and strips language prefixes", () => {
    expect(withLanguage("ky", "/tours")).toBe("/ky/tours");
    expect(withLanguage("en", "/")).toBe("/en");
    expect(stripLanguagePrefix("/ru/tours/ala-kul-trek")).toBe("/tours/ala-kul-trek");
    expect(stripLanguagePrefix("/en")).toBe("/");
  });
});
