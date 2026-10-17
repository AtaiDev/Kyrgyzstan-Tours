import { describe, expect, it } from "vitest";

import { boundsOf, geometry, project, viewBoxFor } from "./geo";

describe("map geometry", () => {
  it("contains all seven regions", () => {
    expect(geometry.regions.map((region) => region.code).sort()).toEqual(
      ["batken", "chuy", "issyk-kul", "jalal-abad", "naryn", "osh", "talas"],
    );
  });

  it("projects Bishkek inside Chuy region bounds", () => {
    const [x, y] = project(42.8746, 74.6122);
    const chuy = geometry.regions.find((region) => region.code === "chuy");
    expect(chuy).toBeDefined();
    const [bx, by, bw, bh] = chuy!.bbox;
    expect(x).toBeGreaterThan(bx);
    expect(x).toBeLessThan(bx + bw);
    expect(y).toBeGreaterThan(by);
    expect(y).toBeLessThan(by + bh);
  });

  it("keeps the map aspect ratio when focusing", () => {
    const [, , width, height] = viewBoxFor([100, 100, 50, 10]).split(" ").map(Number);
    expect(width / height).toBeCloseTo(geometry.width / geometry.height, 1);
  });

  it("never zooms in beyond the minimum width", () => {
    const [x, , width] = viewBoxFor([400, 200, 1, 1], 0.35, 300).split(" ").map(Number);
    expect(width).toBeGreaterThanOrEqual(300);
    expect(x + width / 2).toBeCloseTo(400.5, 0);
  });

  it("computes bounds of points", () => {
    expect(boundsOf([[1, 2], [5, 8]])).toEqual([1, 2, 4, 6]);
  });
});
