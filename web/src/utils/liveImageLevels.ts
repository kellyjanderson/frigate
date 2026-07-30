import { LiveImageLevels } from "@/types/live";

export const DEFAULT_LIVE_IMAGE_LEVELS: LiveImageLevels = {
  blackPoint: 0,
  shadowPoint: 64,
  midtonePoint: 128,
  highlightPoint: 192,
  whitePoint: 255,
};

type LegacyLiveImageLevels = {
  blackPoint?: number;
  midtones?: number;
  whitePoint?: number;
};

const LEVEL_KEYS = [
  "blackPoint",
  "shadowPoint",
  "midtonePoint",
  "highlightPoint",
  "whitePoint",
] as const;

const OUTPUT_POINTS = LEVEL_KEYS.map(
  (key) => DEFAULT_LIVE_IMAGE_LEVELS[key] / 255,
);

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function normalizeLiveImageLevels(
  levels?: Partial<LiveImageLevels> & LegacyLiveImageLevels,
): LiveImageLevels {
  const blackPoint = Math.round(clamp(levels?.blackPoint ?? 0, 0, 251));
  const whitePoint = Math.round(
    clamp(levels?.whitePoint ?? 255, blackPoint + 4, 255),
  );

  const legacyGamma =
    levels?.midtonePoint == undefined && levels?.midtones != undefined
      ? clamp(levels.midtones, 0.1, 4)
      : undefined;
  const inputForOutput = (output: number) =>
    Math.round(
      blackPoint +
        (whitePoint - blackPoint) *
          (legacyGamma == undefined ? output : Math.pow(output, legacyGamma)),
    );

  const shadowPoint = Math.round(
    clamp(
      levels?.shadowPoint ?? inputForOutput(64 / 255),
      blackPoint + 1,
      whitePoint - 3,
    ),
  );
  const midtonePoint = Math.round(
    clamp(
      levels?.midtonePoint ?? inputForOutput(128 / 255),
      shadowPoint + 1,
      whitePoint - 2,
    ),
  );
  const highlightPoint = Math.round(
    clamp(
      levels?.highlightPoint ?? inputForOutput(192 / 255),
      midtonePoint + 1,
      whitePoint - 1,
    ),
  );

  return {
    blackPoint,
    shadowPoint,
    midtonePoint,
    highlightPoint,
    whitePoint,
  };
}

export function isDefaultLiveImageLevels(levels: LiveImageLevels) {
  const normalized = normalizeLiveImageLevels(levels);

  return LEVEL_KEYS.every(
    (key) => normalized[key] === DEFAULT_LIVE_IMAGE_LEVELS[key],
  );
}

export function createLiveImageLevelsTable(
  levels: LiveImageLevels,
  sampleCount = 256,
) {
  const normalized = normalizeLiveImageLevels(levels);
  const inputPoints = LEVEL_KEYS.map((key) => normalized[key] / 255);

  return Array.from({ length: sampleCount }, (_, index) => {
    const input = index / (sampleCount - 1);

    if (input <= inputPoints[0]) {
      return "0.000000";
    }

    if (input >= inputPoints[inputPoints.length - 1]) {
      return "1.000000";
    }

    const segmentIndex = inputPoints.findIndex(
      (point, pointIndex) => pointIndex > 0 && input <= point,
    );
    const inputStart = inputPoints[segmentIndex - 1];
    const inputEnd = inputPoints[segmentIndex];
    const outputStart = OUTPUT_POINTS[segmentIndex - 1];
    const outputEnd = OUTPUT_POINTS[segmentIndex];
    const position = (input - inputStart) / (inputEnd - inputStart);

    return (outputStart + position * (outputEnd - outputStart)).toFixed(6);
  }).join(" ");
}
