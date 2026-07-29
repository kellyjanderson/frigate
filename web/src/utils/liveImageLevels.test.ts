import {
  createLiveImageLevelsTable,
  DEFAULT_LIVE_IMAGE_LEVELS,
  normalizeLiveImageLevels,
} from "./liveImageLevels";
import { describe, expect, it } from "vitest";

function parseTable(table: string) {
  return table.split(" ").map(Number);
}

describe("live image levels", () => {
  it("leaves the default tonal range unchanged", () => {
    const table = parseTable(
      createLiveImageLevelsTable(DEFAULT_LIVE_IMAGE_LEVELS),
    );

    expect(table[0]).toBe(0);
    expect(table[128]).toBeCloseTo(128 / 255, 5);
    expect(table[255]).toBe(1);
  });

  it("clips values outside the selected black and white points", () => {
    const table = parseTable(
      createLiveImageLevelsTable({
        blackPoint: 64,
        midtones: 1,
        whitePoint: 192,
      }),
    );

    expect(table[63]).toBe(0);
    expect(table[64]).toBe(0);
    expect(table[128]).toBeCloseTo(0.5, 2);
    expect(table[192]).toBe(1);
    expect(table[193]).toBe(1);
  });

  it("uses standard levels gamma to brighten or darken midtones", () => {
    const brighter = parseTable(
      createLiveImageLevelsTable({
        blackPoint: 0,
        midtones: 2,
        whitePoint: 255,
      }),
    );
    const darker = parseTable(
      createLiveImageLevelsTable({
        blackPoint: 0,
        midtones: 0.5,
        whitePoint: 255,
      }),
    );

    expect(brighter[128]).toBeGreaterThan(128 / 255);
    expect(darker[128]).toBeLessThan(128 / 255);
  });

  it("normalizes persisted values into a valid range", () => {
    expect(
      normalizeLiveImageLevels({
        blackPoint: 300,
        midtones: 0,
        whitePoint: -10,
      }),
    ).toEqual({
      blackPoint: 254,
      midtones: 0.1,
      whitePoint: 255,
    });
  });
});
