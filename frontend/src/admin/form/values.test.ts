import { describe, expect, it } from "vitest";

import type { FieldConfig } from "../resources/types";
import { buildPayload, initialValues, validateValues, writeField } from "./values";

const fields: FieldConfig[] = [
  { type: "text", name: "title", label: "Название", translated: true, required: true, maxLength: 20 },
  { type: "decimal", name: "price", label: "Цена", required: true, min: 0 },
  { type: "image", name: "cover", label: "Обложка" },
  { type: "gallery", name: "gallery", label: "Галерея" },
  { type: "inline", name: "days", label: "Дни", itemLabel: "День", fields: [{ type: "text", name: "title", label: "Заголовок", translated: true, required: true }] },
];

describe("admin form values", () => {
  it("builds translations and media identifiers", () => {
    let values = initialValues([{ title: "", fields }]);
    values = writeField(values, fields[0], "ky", "Ала-Көл");
    values = { ...values, price: "120", cover: { id: 7 }, gallery: [{ id: 3 }, { id: 9 }], days: [{ translations: { en: { title: "Day 1" } } }] };
    const payload = buildPayload(fields, values);
    expect(payload.translations).toEqual({ ru: { title: "" }, en: { title: "" }, ky: { title: "Ала-Көл" } });
    expect(payload.cover).toBe(7);
    expect(payload.gallery).toEqual([3, 9]);
    expect(payload.price).toBe("120");
    expect(payload.days).toEqual([{ translations: { ru: { title: "" }, en: { title: "Day 1" }, ky: { title: "" } } }]);
  });

  it("requires translated fields in at least one language", () => {
    const values = initialValues([{ title: "", fields }]);
    const errors = validateValues(fields, { ...values, price: "" });
    expect(errors["translations.ru.title"]).toBeDefined();
    expect(errors.price).toBeDefined();
  });

  it("validates nested inline items and limits", () => {
    const values = writeField(initialValues([{ title: "", fields }]), fields[0], "en", "x".repeat(25));
    const errors = validateValues(fields, { ...values, price: "-1", days: [{ translations: {} }] });
    expect(errors["translations.en.title"]).toContain("20");
    expect(errors.price).toContain("0");
    expect(errors["days.0.translations.ru.title"]).toBeDefined();
  });
});
