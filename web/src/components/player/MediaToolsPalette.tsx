import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserPersistence } from "@/hooks/use-user-persistence";
import { LIVE_IMAGE_MEDIA_SELECTOR } from "@/hooks/use-live-image-histogram";
import { LiveImageLevels } from "@/types/live";
import {
  DEFAULT_LIVE_IMAGE_LEVELS,
  isDefaultLiveImageLevels,
  normalizeLiveImageLevels,
} from "@/utils/liveImageLevels";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuSlidersHorizontal, LuX } from "react-icons/lu";
import LiveImageLevelsControl from "./LiveImageLevelsControl";
import LiveImageLevelsFilter from "./LiveImageLevelsFilter";

export default function MediaToolsPalette() {
  const { t } = useTranslation(["common"]);
  const [isOpen, setIsOpen] = useState(false);
  const [persistedLevels, setPersistedLevels, levelsLoaded] =
    useUserPersistence<LiveImageLevels>(
      "media-tools-levels",
      DEFAULT_LIVE_IMAGE_LEVELS,
    );
  const levels = normalizeLiveImageLevels(persistedLevels);
  const filterInstanceId = useId().replaceAll(":", "");
  const filterId = `media-tools-levels-${filterInstanceId}`;
  const launcherRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  const closePalette = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        launcherRef.current?.focus();
      }
      return;
    }

    wasOpenRef.current = true;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      closePalette();
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [closePalette, isOpen]);

  return (
    <>
      <LiveImageLevelsFilter filterId={filterId} levels={levels} />
      {!isDefaultLiveImageLevels(levels) && (
        <style>{`${LIVE_IMAGE_MEDIA_SELECTOR} { filter: url("#${filterId}") !important; will-change: filter; }`}</style>
      )}

      {isOpen && (
        <section
          id="media-tools-palette"
          aria-label={t("mediaTools.title")}
          className="fixed bottom-16 right-4 z-50 flex max-h-[calc(100dvh-6rem)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl md:bottom-12"
          data-media-tools-palette
          role="dialog"
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">{t("mediaTools.title")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("mediaTools.description")}
              </p>
            </div>
            <Button
              ref={closeRef}
              aria-label={t("mediaTools.close")}
              className="shrink-0"
              size="icon"
              variant="ghost"
              onClick={closePalette}
            >
              <LuX className="size-5" />
            </Button>
          </header>
          <div className="overflow-y-auto p-4">
            <LiveImageLevelsControl
              disabled={!levelsLoaded}
              levels={levels}
              onChange={setPersistedLevels}
            />
          </div>
        </section>
      )}

      {!isOpen && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={launcherRef}
              aria-controls="media-tools-palette"
              aria-expanded={false}
              aria-label={t("mediaTools.open")}
              className="fixed bottom-16 right-4 z-50 size-11 rounded-full shadow-xl md:bottom-12"
              data-media-tools-launcher
              size="icon"
              onClick={() => setIsOpen(true)}
            >
              <LuSlidersHorizontal className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{t("mediaTools.open")}</TooltipContent>
        </Tooltip>
      )}
    </>
  );
}
