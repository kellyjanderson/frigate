import { LiveImageLevels } from "@/types/live";
import { createLiveImageLevelsTable } from "@/utils/liveImageLevels";
import { useMemo } from "react";

type LiveImageLevelsFilterProps = {
  filterId: string;
  levels: LiveImageLevels;
};

export default function LiveImageLevelsFilter({
  filterId,
  levels,
}: LiveImageLevelsFilterProps) {
  const tableValues = useMemo(
    () => createLiveImageLevelsTable(levels),
    [levels],
  );

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute size-0"
      focusable="false"
    >
      <filter
        id={filterId}
        colorInterpolationFilters="sRGB"
        x="0"
        y="0"
        width="1"
        height="1"
      >
        <feComponentTransfer>
          <feFuncR type="table" tableValues={tableValues} />
          <feFuncG type="table" tableValues={tableValues} />
          <feFuncB type="table" tableValues={tableValues} />
        </feComponentTransfer>
      </filter>
    </svg>
  );
}
