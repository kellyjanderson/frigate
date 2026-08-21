import { Button } from "@/components/ui/button";
import { useLiveImageHistogram } from "@/hooks/use-live-image-histogram";
import { LiveImageLevels } from "@/types/live";
import {
  DEFAULT_LIVE_IMAGE_LEVELS,
  isDefaultLiveImageLevels,
  normalizeLiveImageLevels,
  selectMovableLiveImageLevelPoint,
  updateLiveImageLevelPoint,
} from "@/utils/liveImageLevels";
import type { LiveImageLevelKey } from "@/utils/liveImageLevels";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { PointerEvent as ReactPointerEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type LiveImageLevelsControlProps = {
  levels: LiveImageLevels;
  onChange: (levels: LiveImageLevels) => void;
  disabled?: boolean;
};

export default function LiveImageLevelsControl({
  levels,
  onChange,
  disabled = false,
}: LiveImageLevelsControlProps) {
  const { t } = useTranslation(["views/live", "common"]);
  const normalized = normalizeLiveImageLevels(levels);
  const activeHandleIndexRef = useRef(0);
  const [activeHandleIndex, setActiveHandleIndex] = useState(0);
  const draggingRef = useRef<
    { pointerId: number; handleIndex: number } | undefined
  >(undefined);
  const trackRef = useRef<HTMLSpanElement>(null);
  const histogram = useLiveImageHistogram(!disabled);

  const handles = [
    {
      key: "blackPoint",
      label: t("levels.blackPoint"),
      value: normalized.blackPoint,
    },
    {
      key: "shadowPoint",
      label: t("levels.shadows"),
      value: normalized.shadowPoint,
    },
    {
      key: "midtonePoint",
      label: t("levels.midtones"),
      value: normalized.midtonePoint,
    },
    {
      key: "highlightPoint",
      label: t("levels.highlights"),
      value: normalized.highlightPoint,
    },
    {
      key: "whitePoint",
      label: t("levels.whitePoint"),
      value: normalized.whitePoint,
    },
  ] as const;

  const stopPointerDrag = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (draggingRef.current?.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    draggingRef.current = undefined;
  };

  const updatePointerDrag = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const dragging = draggingRef.current;
    const track = trackRef.current;

    if (dragging?.pointerId !== event.pointerId || track == null) {
      return;
    }

    event.preventDefault();
    const bounds = track.getBoundingClientRect();
    if (bounds.width === 0) {
      return;
    }

    const position = (event.clientX - bounds.left) / bounds.width;
    const value = Math.round(Math.min(Math.max(position, 0), 1) * 255);
    const handle = handles[dragging.handleIndex];
    onChange(updateLiveImageLevelPoint(normalized, handle.key, value));
  };

  const startPointerDrag = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (disabled || event.button !== 0) {
      return;
    }

    const control = event.currentTarget;
    const hitKeys: LiveImageLevelKey[] = [];

    for (const element of document.elementsFromPoint(
      event.clientX,
      event.clientY,
    )) {
      const thumb = element.closest<HTMLElement>("[data-level-handle]");
      const key = thumb?.dataset.levelHandle as LiveImageLevelKey | undefined;

      if (
        thumb != null &&
        control.contains(thumb) &&
        key != undefined &&
        !hitKeys.includes(key)
      ) {
        hitKeys.push(key);
      }
    }

    const selectedKey = selectMovableLiveImageLevelPoint(normalized, hitKeys);
    const handleIndex = handles.findIndex(({ key }) => key === selectedKey);

    if (handleIndex < 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    activeHandleIndexRef.current = handleIndex;
    setActiveHandleIndex(handleIndex);
    draggingRef.current = { pointerId: event.pointerId, handleIndex };
    control.setPointerCapture(event.pointerId);
    control
      .querySelector<HTMLElement>(`[data-level-handle="${selectedKey}"]`)
      ?.focus({ preventScroll: true });
  };

  const histogramMaximum = histogram == undefined ? 0 : Math.max(...histogram);

  return (
    <div className="flex min-w-64 flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium">{t("levels.title")}</div>
          <p className="text-xs text-muted-foreground">
            {t("levels.description")}
          </p>
        </div>
        <Button
          aria-label={t("levels.reset")}
          className="shrink-0"
          disabled={disabled || isDefaultLiveImageLevels(normalized)}
          size="sm"
          variant="outline"
          onClick={() => onChange(DEFAULT_LIVE_IMAGE_LEVELS)}
        >
          {t("button.reset", { ns: "common" })}
        </Button>
      </div>
      <SliderPrimitive.Root
        aria-label={t("levels.title")}
        className="relative flex h-28 w-full touch-none select-none items-end px-2"
        data-levels-control
        disabled={disabled}
        max={255}
        min={0}
        step={1}
        value={handles.map(({ value }) => value)}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            event.preventDefault();
          }
        }}
        onPointerCancel={stopPointerDrag}
        onPointerDownCapture={startPointerDrag}
        onPointerMove={updatePointerDrag}
        onPointerUp={stopPointerDrag}
        onValueChange={(values) => {
          const handleIndex = activeHandleIndexRef.current;
          const handle = handles[handleIndex];
          onChange(
            updateLiveImageLevelPoint(
              normalized,
              handle.key,
              values[handleIndex],
            ),
          );
        }}
      >
        <SliderPrimitive.Track
          ref={trackRef}
          className="pointer-events-none absolute inset-x-2 bottom-5 top-0 overflow-hidden rounded-md border border-border bg-gradient-to-r from-black via-zinc-500 to-white"
          data-levels-track
        >
          {histogram != undefined && (
            <svg
              aria-hidden="true"
              className="absolute inset-0 size-full"
              data-levels-histogram
              preserveAspectRatio="none"
              viewBox={`0 0 ${histogram.length} 100`}
            >
              {histogram.map((count, index) => {
                const height =
                  histogramMaximum === 0
                    ? 0
                    : (Math.log1p(count) / Math.log1p(histogramMaximum)) * 94;

                return (
                  <rect
                    fill="hsl(var(--foreground))"
                    height={height}
                    key={index}
                    opacity="0.65"
                    width="1"
                    x={index}
                    y={100 - height}
                  />
                );
              })}
            </svg>
          )}
          <span className="absolute inset-0 bg-[linear-gradient(to_right,transparent_24.8%,hsl(var(--border))_25%,transparent_25.2%,transparent_49.8%,hsl(var(--border))_50%,transparent_50.2%,transparent_74.8%,hsl(var(--border))_75%,transparent_75.2%)] opacity-70" />
        </SliderPrimitive.Track>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-2 top-0 overflow-visible"
          preserveAspectRatio="none"
          style={{
            width: "calc(100% - 1rem)",
            height: "calc(100% - 0.625rem)",
          }}
          viewBox="0 0 255 100"
        >
          {handles.map(({ key, value }) => (
            <g data-level-guide={key} key={key}>
              <line
                stroke="hsl(var(--background))"
                strokeWidth="4"
                vectorEffect="non-scaling-stroke"
                x1={DEFAULT_LIVE_IMAGE_LEVELS[key]}
                x2={value}
                y1="0"
                y2="100"
              />
              <line
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                x1={DEFAULT_LIVE_IMAGE_LEVELS[key]}
                x2={value}
                y1="0"
                y2="100"
              />
            </g>
          ))}
        </svg>
        {handles.map(({ key, label, value }, handleIndex) => (
          <SliderPrimitive.Thumb
            aria-label={label}
            aria-valuetext={`${label}: ${value}`}
            className="group relative block size-11 cursor-ew-resize touch-none focus-visible:outline-none disabled:cursor-not-allowed"
            data-level-handle={key}
            key={key}
            onFocus={() => {
              if (draggingRef.current == undefined) {
                activeHandleIndexRef.current = handleIndex;
                setActiveHandleIndex(handleIndex);
              }
            }}
            style={{
              zIndex: handleIndex === activeHandleIndex ? 2 : 1,
            }}
          >
            <span className="absolute bottom-0 left-1/2 size-5 -translate-x-1/2 rounded-full border-2 border-background bg-primary shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-data-[disabled]:opacity-40" />
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>
      <div className="grid grid-cols-5 gap-1" aria-hidden="true">
        {handles.map(({ key, label, value }) => (
          <div
            className="min-w-0 text-center text-[10px] leading-tight text-muted-foreground"
            key={key}
            title={label}
          >
            <div className="truncate">{label}</div>
            <output className="font-mono tabular-nums">{value}</output>
          </div>
        ))}
      </div>
    </div>
  );
}
