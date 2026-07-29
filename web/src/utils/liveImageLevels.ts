import { LiveImageLevels } from "@/types/live";

export const DEFAULT_LIVE_IMAGE_LEVELS: LiveImageLevels = {
  blackPoint: 0,
  midtones: 1,
  whitePoint: 255,
};

const MIN_MIDTONES = 0.1;
const MAX_MIDTONES = 4;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function normalizeLiveImageLevels(
  levels?: Partial<LiveImageLevels>,
): LiveImageLevels {
  const blackPoint = Math.round(clamp(levels?.blackPoint ?? 0, 0, 254));
  const whitePoint = Math.round(
    clamp(levels?.whitePoint ?? 255, blackPoint + 1, 255),
  );

  return {
    blackPoint,
    midtones: clamp(levels?.midtones ?? 1, MIN_MIDTONES, MAX_MIDTONES),
    whitePoint,
  };
}

export function isDefaultLiveImageLevels(levels: LiveImageLevels) {
  const normalized = normalizeLiveImageLevels(levels);

  return (
    normalized.blackPoint === DEFAULT_LIVE_IMAGE_LEVELS.blackPoint &&
    normalized.midtones === DEFAULT_LIVE_IMAGE_LEVELS.midtones &&
    normalized.whitePoint === DEFAULT_LIVE_IMAGE_LEVELS.whitePoint
  );
}

export function createLiveImageLevelsTable(
  levels: LiveImageLevels,
  sampleCount = 256,
) {
  const normalized = normalizeLiveImageLevels(levels);
  const blackPoint = normalized.blackPoint / 255;
  const whitePoint = normalized.whitePoint / 255;
  const exponent = 1 / normalized.midtones;

  return Array.from({ length: sampleCount }, (_, index) => {
    const input = index / (sampleCount - 1);
    const scaled = clamp(
      (input - blackPoint) / (whitePoint - blackPoint),
      0,
      1,
    );

    return Math.pow(scaled, exponent).toFixed(6);
  }).join(" ");
}
