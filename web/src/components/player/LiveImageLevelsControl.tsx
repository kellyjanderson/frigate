import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { LiveImageLevels } from "@/types/live";
import {
  DEFAULT_LIVE_IMAGE_LEVELS,
  isDefaultLiveImageLevels,
  normalizeLiveImageLevels,
} from "@/utils/liveImageLevels";
import { useId } from "react";
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
  const id = useId().replaceAll(":", "");
  const normalized = normalizeLiveImageLevels(levels);

  const updateLevels = (update: Partial<LiveImageLevels>) => {
    onChange(normalizeLiveImageLevels({ ...normalized, ...update }));
  };

  const controls = [
    {
      key: "blackPoint",
      label: t("levels.blackPoint"),
      value: normalized.blackPoint,
      minimum: 0,
      maximum: normalized.whitePoint - 1,
      step: 1,
      displayValue: normalized.blackPoint.toString(),
    },
    {
      key: "midtones",
      label: t("levels.midtones"),
      value: normalized.midtones,
      minimum: 0.1,
      maximum: 4,
      step: 0.05,
      displayValue: normalized.midtones.toFixed(2),
    },
    {
      key: "whitePoint",
      label: t("levels.whitePoint"),
      value: normalized.whitePoint,
      minimum: normalized.blackPoint + 1,
      maximum: 255,
      step: 1,
      displayValue: normalized.whitePoint.toString(),
    },
  ] as const;

  return (
    <div className="flex min-w-64 flex-col gap-4">
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
      {controls.map((control) => {
        const labelId = `${id}-${control.key}-label`;
        const valueId = `${id}-${control.key}-value`;

        return (
          <div className="flex flex-col gap-2" key={control.key}>
            <div className="flex items-center justify-between gap-3">
              <Label id={labelId}>{control.label}</Label>
              <output
                aria-live="off"
                className="w-12 text-right font-mono text-xs tabular-nums text-muted-foreground"
                id={valueId}
              >
                {control.displayValue}
              </output>
            </div>
            <Slider
              aria-labelledby={labelId}
              aria-describedby={valueId}
              disabled={disabled}
              max={control.maximum}
              min={control.minimum}
              step={control.step}
              value={[control.value]}
              onValueChange={([value]) =>
                updateLevels({ [control.key]: value })
              }
            />
          </div>
        );
      })}
    </div>
  );
}
