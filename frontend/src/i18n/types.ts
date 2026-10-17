import type { MessageKey, PluralKey } from "./dictionaries/en";

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

export interface Dictionary {
  messages: Record<MessageKey, string>;
  plurals: Record<PluralKey, PluralForms>;
}

export type { MessageKey, PluralKey };
