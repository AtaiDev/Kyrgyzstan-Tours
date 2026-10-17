import { describe, expect, it } from "vitest";

import { paramsFromSearch, toNumber, updateSearch } from "./query";

describe("query helpers", () => {
  it("collects only known non-empty keys", () => {
    const search = new URLSearchParams("region=naryn&style=&foo=bar");
    expect(paramsFromSearch(search, ["region", "style"])).toEqual({ region: "naryn" });
  });

  it("resets pagination when filters change", () => {
    const search = new URLSearchParams("region=naryn&page=3");
    expect(updateSearch(search, { region: "osh" }).toString()).toBe("region=osh");
    expect(updateSearch(search, { page: "4" }).get("page")).toBe("4");
    expect(updateSearch(search, { region: null }).has("region")).toBe(false);
  });

  it("parses numbers safely", () => {
    expect(toNumber("12")).toBe(12);
    expect(toNumber("abc")).toBeNull();
    expect(toNumber("")).toBeNull();
  });
});
