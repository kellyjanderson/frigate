import { useEffect, useState } from "react";

export const LIVE_IMAGE_HISTOGRAM_BINS = 64;
export const LIVE_IMAGE_MEDIA_SELECTOR = [
  "body video:not([data-media-tools-ignore])",
  "body img:not([data-media-tools-ignore])",
  "body canvas[data-media-tools-target]",
].join(",");

type HistogramSource = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

export function createLuminanceHistogram(
  pixels: Uint8ClampedArray,
  binCount = LIVE_IMAGE_HISTOGRAM_BINS,
) {
  const bins = Array.from({ length: binCount }, () => 0);

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] === 0) {
      continue;
    }

    const luminance =
      pixels[index] * 0.2126 +
      pixels[index + 1] * 0.7152 +
      pixels[index + 2] * 0.0722;
    const binIndex = Math.min(
      Math.floor((luminance / 256) * binCount),
      binCount - 1,
    );
    bins[binIndex] += 1;
  }

  return bins;
}

function isReady(source: HistogramSource) {
  if (source instanceof HTMLVideoElement) {
    return source.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
  }

  if (source instanceof HTMLImageElement) {
    return source.complete && source.naturalWidth > 0;
  }

  return source.width > 0 && source.height > 0;
}

function visibleArea(source: HistogramSource) {
  const bounds = source.getBoundingClientRect();
  const visibleWidth = Math.max(
    0,
    Math.min(bounds.right, window.innerWidth) - Math.max(bounds.left, 0),
  );
  const visibleHeight = Math.max(
    0,
    Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0),
  );

  return visibleWidth * visibleHeight;
}

export function useLiveImageHistogram(enabled: boolean) {
  const [histogram, setHistogram] = useState<number[]>();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const createSamplingCanvas = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 72;
      return canvas;
    };
    let canvas = createSamplingCanvas();
    let context = canvas.getContext("2d", {
      alpha: false,
      willReadFrequently: true,
    });
    let animationFrame: number | undefined;
    let timeout: number | undefined;
    let stopped = false;

    const scheduleSample = () => {
      timeout = window.setTimeout(() => {
        animationFrame = window.requestAnimationFrame(sample);
      }, 750);
    };

    const sample = () => {
      if (stopped) {
        return;
      }

      if (context != null && document.visibilityState !== "hidden") {
        const sources = Array.from(
          document.querySelectorAll<HistogramSource>(LIVE_IMAGE_MEDIA_SELECTOR),
        )
          .filter((source) => isReady(source) && visibleArea(source) > 0)
          .sort((first, second) => visibleArea(second) - visibleArea(first));

        for (const source of sources) {
          const samplingContext = context;
          if (samplingContext == null) {
            break;
          }

          try {
            samplingContext.drawImage(
              source,
              0,
              0,
              canvas.width,
              canvas.height,
            );
            const pixels = samplingContext.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            ).data;
            setHistogram(createLuminanceHistogram(pixels));
            break;
          } catch {
            // A cross-origin media source can taint the sampling canvas. Try the
            // next visible source without disrupting playback or the control.
            canvas = createSamplingCanvas();
            context = canvas.getContext("2d", {
              alpha: false,
              willReadFrequently: true,
            });
          }
        }
      }

      scheduleSample();
    };

    sample();

    return () => {
      stopped = true;
      if (timeout != undefined) {
        window.clearTimeout(timeout);
      }
      if (animationFrame != undefined) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [enabled]);

  return histogram;
}
