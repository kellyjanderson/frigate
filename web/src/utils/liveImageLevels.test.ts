import {
  createLiveImageLevelsTable,
  DEFAULT_LIVE_IMAGE_LEVELS,
  isLiveImageLevelPointTrapped,
  normalizeLiveImageLevels,
  selectMovableLiveImageLevelPoint,
  updateLiveImageLevelPoint,
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
        shadowPoint: 96,
        midtonePoint: 128,
        highlightPoint: 160,
        whitePoint: 192,
      }),
    );

    expect(table[63]).toBe(0);
    expect(table[64]).toBe(0);
    expect(table[128]).toBeCloseTo(0.5, 2);
    expect(table[192]).toBe(1);
    expect(table[193]).toBe(1);
  });

  it("uses five ordered tonal anchors to brighten or darken regions", () => {
    const brighter = parseTable(
      createLiveImageLevelsTable({
        blackPoint: 0,
        shadowPoint: 32,
        midtonePoint: 96,
        highlightPoint: 176,
        whitePoint: 255,
      }),
    );
    const darker = parseTable(
      createLiveImageLevelsTable({
        blackPoint: 0,
        shadowPoint: 80,
        midtonePoint: 160,
        highlightPoint: 224,
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
        shadowPoint: -20,
        midtonePoint: -10,
        highlightPoint: -5,
        whitePoint: -10,
      }),
    ).toEqual({
      blackPoint: 251,
      shadowPoint: 252,
      midtonePoint: 253,
      highlightPoint: 254,
      whitePoint: 255,
    });
  });

  it("migrates the previous three-point gamma values", () => {
    expect(
      normalizeLiveImageLevels({
        blackPoint: 0,
        midtones: 1,
        whitePoint: 255,
      }),
    ).toEqual(DEFAULT_LIVE_IMAGE_LEVELS);
  });

  it("stops each point at its neighbors without moving them", () => {
    expect(
      updateLiveImageLevelPoint(DEFAULT_LIVE_IMAGE_LEVELS, "shadowPoint", 200),
    ).toEqual({
      ...DEFAULT_LIVE_IMAGE_LEVELS,
      shadowPoint: 127,
    });
    expect(
      updateLiveImageLevelPoint(DEFAULT_LIVE_IMAGE_LEVELS, "midtonePoint", 0),
    ).toEqual({
      ...DEFAULT_LIVE_IMAGE_LEVELS,
      midtonePoint: 65,
    });
  });

  it("identifies points trapped by their neighbors or an edge", () => {
    const levels = {
      blackPoint: 0,
      shadowPoint: 1,
      midtonePoint: 2,
      highlightPoint: 200,
      whitePoint: 255,
    };

    expect(isLiveImageLevelPointTrapped(levels, "blackPoint")).toBe(true);
    expect(isLiveImageLevelPointTrapped(levels, "shadowPoint")).toBe(true);
    expect(isLiveImageLevelPointTrapped(levels, "midtonePoint")).toBe(false);
  });

  it("selects the first movable point below a trapped hit point", () => {
    const levels = {
      blackPoint: 0,
      shadowPoint: 1,
      midtonePoint: 2,
      highlightPoint: 200,
      whitePoint: 255,
    };

    expect(
      selectMovableLiveImageLevelPoint(levels, [
        "shadowPoint",
        "midtonePoint",
        "blackPoint",
      ]),
    ).toBe("midtonePoint");
  });
});
