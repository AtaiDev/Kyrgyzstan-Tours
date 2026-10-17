import type { Language } from "../languages";
import type { Dictionary } from "../types";
import { enMessages, enPlurals } from "./en";
import { ky } from "./ky";
import { ru } from "./ru";

export const en: Dictionary = { messages: enMessages, plurals: enPlurals };

export const dictionaries: Record<Language, Dictionary> = { ru, en, ky };
