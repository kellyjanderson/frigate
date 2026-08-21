import { createLuminanceHistogram } from "./use-live-image-histogram";
import { describe, expect, it } from "vitest";

describe("live image histogram", () => {
  it("bins opaque pixels by luminance and ignores transparent pixels", () => {
    const histogram = createLuminanceHistogram(
      new Uint8ClampedArray([
        0, 0, 0, 255, 255, 255, 255, 255, 80, 80, 80, 255, 0, 0, 0, 0,
      ]),
      4,
    );

    expect(histogram).toEqual([1, 1, 0, 1]);
  });
});
