import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type {
  CameraControlDescriptor,
  CameraControlValue,
  DescriptorCommitCallback,
  DescriptorCommitState,
  DescriptorValidationCode,
  DescriptorValidationResult,
} from "@/types/cameraControls";
import {
  getDescriptorEditorKind,
  validateDescriptorValue,
} from "@/utils/cameraControlDescriptors";

export type DescriptorValueEditorProps = {
  descriptor: CameraControlDescriptor;
  commitState: DescriptorCommitState;
  ariaLabelledBy: string;
  ariaDescribedBy?: string;
  unsupportedDescription: string;
  onCommit: DescriptorCommitCallback;
  onValidationChange: (
    controlId: string,
    code: DescriptorValidationCode | null,
  ) => void;
};

type Draft = CameraControlValue;

function draftForState(state: DescriptorCommitState): Draft {
  return state.status === "pending"
    ? state.submittedValue
    : state.authoritativeValue;
}

function sameValue(left: Draft, right: Draft) {
  return Object.is(left, right);
}

function parseExactInteger(value: string): number | string {
  return /^-?(?:0|[1-9][0-9]*)$/.test(value) ? Number(value) : value;
}

function editorPolicyKey(descriptor: CameraControlDescriptor) {
  return JSON.stringify([
    descriptor.serialized_id,
    getDescriptorEditorKind(descriptor),
    descriptor.minimum,
    descriptor.maximum,
    descriptor.step,
    descriptor.menu_items,
    descriptor.state.active,
    descriptor.state.writable,
  ]);
}

function selectedMenuIndex(
  descriptor: CameraControlDescriptor,
  draft: Draft,
  integerMenu: boolean,
  draftIsAuthoritative: boolean,
) {
  const item = descriptor.menu_items.find((candidate) =>
    integerMenu
      ? draftIsAuthoritative
        ? candidate.index === draft
        : candidate.value === draft
      : candidate.index === draft,
  );
  return item === undefined ? undefined : String(item.index);
}

export function DescriptorValueEditor({
  descriptor,
  commitState,
  ariaLabelledBy,
  ariaDescribedBy,
  unsupportedDescription,
  onCommit,
  onValidationChange,
}: DescriptorValueEditorProps) {
  const editorKind = getDescriptorEditorKind(descriptor);
  const policyKey = editorPolicyKey(descriptor);
  const [draft, setDraft] = useState<Draft>(() => draftForState(commitState));
  const [draftIsAuthoritative, setDraftIsAuthoritative] = useState(
    commitState.status !== "pending",
  );
  const [validationCode, setValidationCode] =
    useState<DescriptorValidationCode | null>(null);
  const lifecycleRef = useRef({
    policyKey,
    status: commitState.status,
    authoritativeValue: commitState.authoritativeValue,
  });
  const enterAttemptRef = useRef<Draft | undefined>(undefined);
  const disabled =
    commitState.status === "pending" || !descriptor.state.writable;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    const previous = lifecycleRef.current;
    const policyChanged = previous.policyKey !== policyKey;
    const authoritativeValueChanged = !sameValue(
      previous.authoritativeValue,
      commitState.authoritativeValue,
    );
    const pendingResolved =
      previous.status === "pending" && commitState.status !== "pending";

    if (policyChanged || authoritativeValueChanged || pendingResolved) {
      setDraft(commitState.authoritativeValue);
      setDraftIsAuthoritative(true);
      enterAttemptRef.current = undefined;
      if (validationCode !== null) {
        setValidationCode(null);
        onValidationChange(descriptor.serialized_id, null);
      }
    }

    lifecycleRef.current = {
      policyKey,
      status: commitState.status,
      authoritativeValue: commitState.authoritativeValue,
    };
  }, [
    commitState.authoritativeValue,
    commitState.status,
    descriptor.serialized_id,
    onValidationChange,
    policyKey,
    validationCode,
  ]);

  const reportValidation = (code: DescriptorValidationCode | null) => {
    if (code === validationCode) {
      return;
    }
    setValidationCode(code);
    onValidationChange(descriptor.serialized_id, code);
  };

  const commitValidated = (
    candidate: unknown,
    updateDraftOnSuccess = false,
    commitUnchanged = false,
  ): DescriptorValidationResult => {
    if (disabledRef.current) {
      return { ok: false, code: "control_not_editable" };
    }

    const result = validateDescriptorValue(descriptor, candidate);
    if (!result.ok) {
      reportValidation(result.code);
      return result;
    }

    reportValidation(null);
    if (updateDraftOnSuccess) {
      setDraft(result.value);
    }
    if (
      commitUnchanged ||
      !sameValue(result.value, commitState.authoritativeValue)
    ) {
      onCommit(descriptor.serialized_id, result.value);
    }
    return result;
  };

  const commitExactDraft = () => {
    const candidate =
      editorKind === "integer" && typeof draft === "string"
        ? parseExactInteger(draft)
        : draft;
    commitValidated(candidate);
  };

  const handleExactKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      enterAttemptRef.current = draft;
      commitExactDraft();
    } else if (event.key === "Escape") {
      event.preventDefault();
      enterAttemptRef.current = undefined;
      setDraft(commitState.authoritativeValue);
      setDraftIsAuthoritative(true);
      reportValidation(null);
    }
  };

  const handleExactBlur = () => {
    if (
      enterAttemptRef.current !== undefined &&
      sameValue(enterAttemptRef.current, draft)
    ) {
      enterAttemptRef.current = undefined;
      return;
    }
    enterAttemptRef.current = undefined;
    commitExactDraft();
  };

  const sharedAria = {
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
  };

  const exactInput = (inputMode: "numeric" | "text") => (
    <Input
      {...sharedAria}
      aria-invalid={validationCode !== null}
      className={cn(
        "h-11 min-w-0 border-muted-foreground focus-visible:ring-primary",
        validationCode !== null &&
          "border-2 border-destructive ring-1 ring-destructive dark:border-destructive-foreground dark:ring-destructive-foreground",
      )}
      disabled={disabled}
      inputMode={inputMode}
      value={draft === null ? "" : String(draft)}
      onBlur={handleExactBlur}
      onChange={(event) => {
        enterAttemptRef.current = undefined;
        setDraftIsAuthoritative(false);
        setDraft(event.target.value);
      }}
      onKeyDown={handleExactKeyDown}
    />
  );

  const editor = (() => {
    switch (editorKind) {
      case "boolean":
        return (
          <Switch
            {...sharedAria}
            checked={draft === true}
            className="min-h-11 min-w-11 focus-visible:ring-primary"
            disabled={disabled}
            onCheckedChange={(checked) => {
              setDraft(checked);
              commitValidated(checked, true);
            }}
          />
        );
      case "integer": {
        const minimum = descriptor.minimum;
        const maximum = descriptor.maximum;
        const step = descriptor.step;
        const intervalCount =
          minimum !== null && maximum !== null && step !== null && step > 0
            ? (maximum - minimum) / step
            : Number.POSITIVE_INFINITY;
        const hasPracticalSlider =
          Number.isSafeInteger(minimum) &&
          Number.isSafeInteger(maximum) &&
          step !== null &&
          step > 0 &&
          Number.isSafeInteger(step) &&
          intervalCount >= 0 &&
          intervalCount <= 1000;

        return (
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
            {hasPracticalSlider && (
              <Slider
                {...sharedAria}
                className="min-h-11 min-w-11 flex-1 [&_[role=slider]:focus-visible]:ring-primary"
                disabled={disabled}
                max={maximum as number}
                min={minimum as number}
                step={step as number}
                value={[
                  typeof draft === "number"
                    ? draft
                    : Number(draft) || (minimum as number),
                ]}
                onValueChange={([value]) => {
                  enterAttemptRef.current = undefined;
                  setDraftIsAuthoritative(false);
                  setDraft(value);
                }}
                onValueCommit={([value]) => commitValidated(value, true)}
              />
            )}
            <div className="min-w-11 sm:w-32 sm:flex-none">
              {exactInput("numeric")}
            </div>
          </div>
        );
      }
      case "menu":
      case "integer-menu": {
        const integerMenu = editorKind === "integer-menu";
        const selectedIndex = selectedMenuIndex(
          descriptor,
          draft,
          integerMenu,
          draftIsAuthoritative,
        );
        const selectedLabel = descriptor.menu_items.find(
          ({ index }) => String(index) === selectedIndex,
        )?.label;
        return (
          <Select
            disabled={disabled}
            value={selectedIndex ?? ""}
            onValueChange={(selectedIndex) => {
              if (disabledRef.current) {
                return;
              }
              const item = descriptor.menu_items.find(
                ({ index }) => String(index) === selectedIndex,
              );
              if (item === undefined) {
                reportValidation("menu_value_not_found");
                return;
              }
              const value = integerMenu ? item.value : item.index;
              setDraftIsAuthoritative(false);
              setDraft(value);
              commitValidated(value, true, integerMenu);
            }}
          >
            <SelectTrigger
              {...sharedAria}
              aria-invalid={validationCode !== null}
              className="h-11 min-w-0 overflow-hidden focus-visible:ring-primary [&>span]:line-clamp-1 [&>span]:min-w-0"
              title={selectedLabel}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-w-[min(32rem,calc(100vw-2rem))]">
              {descriptor.menu_items.map((item) => (
                <SelectItem
                  className="min-h-11 whitespace-normal break-words"
                  key={item.index}
                  value={String(item.index)}
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      case "button":
        return (
          <Button
            {...sharedAria}
            className="min-h-11 min-w-11 whitespace-normal focus-visible:ring-primary"
            disabled={disabled}
            onClick={() => commitValidated(null, false, true)}
          >
            {descriptor.name}
          </Button>
        );
      case "string":
        return exactInput("text");
      case "labeled-bitmask": {
        const mask = typeof draft === "number" ? draft : Number(draft) || 0;
        return (
          <div
            {...sharedAria}
            className="flex min-w-0 flex-wrap gap-2"
            role="group"
          >
            {descriptor.menu_items.map((item) => {
              const bit = item.value ?? 2 ** item.index;
              const checked = Math.floor(mask / bit) % 2 === 1;
              const bitLabelId = `${descriptor.serialized_id}-bit-${item.index}`;
              return (
                <label
                  className="flex min-h-11 min-w-0 cursor-pointer items-center gap-2 whitespace-normal break-words"
                  key={item.index}
                >
                  <Checkbox
                    aria-describedby={ariaDescribedBy}
                    aria-labelledby={`${ariaLabelledBy} ${bitLabelId}`}
                    checked={checked}
                    className="size-11 focus-visible:ring-primary"
                    disabled={disabled}
                    onCheckedChange={(nextChecked) => {
                      if (disabledRef.current) {
                        return;
                      }
                      const nextMask = nextChecked
                        ? checked
                          ? mask
                          : mask + bit
                        : checked
                          ? mask - bit
                          : mask;
                      setDraftIsAuthoritative(false);
                      setDraft(nextMask);
                      commitValidated(nextMask, true);
                    }}
                  />
                  <span className="min-w-0 break-words" id={bitLabelId}>
                    {item.label}
                  </span>
                </label>
              );
            })}
          </div>
        );
      }
      case "numeric-bitmask":
        return exactInput("text");
      case "unsupported":
        return (
          <div className="min-w-0 break-words">{unsupportedDescription}</div>
        );
    }
  })();

  return <div className="min-w-0 max-w-full">{editor}</div>;
}
