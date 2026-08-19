import type {
  CameraControlDescriptor,
  CameraControlMenuItem,
  CameraControlValue,
  DescriptorControlState,
  DescriptorEditorKind,
  DescriptorNormalizationReason,
  DescriptorNormalizationResult,
  DescriptorSafeMetadata,
  DescriptorValidationResult,
} from "@/types/cameraControls";

const CONTROL_TYPE = {
  integer: 1,
  boolean: 2,
  menu: 3,
  button: 4,
  integer64: 5,
  controlClass: 6,
  string: 7,
  bitmask: 8,
  integerMenu: 9,
} as const;

const CONTROL_FLAG = {
  disabled: 0x0001,
  grabbed: 0x0002,
  readOnly: 0x0004,
  inactive: 0x0010,
  hasPayload: 0x0100,
} as const;

const DESCRIPTOR_KEYS = new Set([
  "id",
  "serialized_id",
  "name",
  "control_class",
  "control_type",
  "minimum",
  "maximum",
  "step",
  "default_value",
  "current_value",
  "menu_items",
  "flags",
  "element_size",
  "element_count",
  "dimensions",
  "active",
  "writable",
  "read_supported",
]);

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function validIntegerCandidate(
  candidate: unknown,
): DescriptorValidationResult | number {
  if (typeof candidate !== "number") {
    return { ok: false, code: "invalid_type" };
  }
  if (!Number.isFinite(candidate) || !Number.isInteger(candidate)) {
    return { ok: false, code: "non_finite_integer" };
  }
  if (!Number.isSafeInteger(candidate)) {
    return { ok: false, code: "unsafe_integer" };
  }

  return candidate;
}

function isValidationResult(
  value: DescriptorValidationResult | number,
): value is DescriptorValidationResult {
  return typeof value !== "number";
}

function isOutsideBounds(
  value: number,
  minimum: number | null,
  maximum: number | null,
) {
  return (
    (minimum !== null && value < minimum) ||
    (maximum !== null && value > maximum)
  );
}

function parseBitmaskCandidate(
  candidate: unknown,
): DescriptorValidationResult | number {
  if (typeof candidate === "number") {
    if (!Number.isSafeInteger(candidate) || candidate < 0) {
      return {
        ok: false,
        code:
          Number.isInteger(candidate) && candidate >= 0
            ? "unsafe_integer"
            : "invalid_bitmask",
      };
    }

    return candidate;
  }

  if (typeof candidate !== "string") {
    return { ok: false, code: "invalid_type" };
  }
  if (!/^(?:[0-9]+|0[xX][0-9a-fA-F]+)$/.test(candidate)) {
    return { ok: false, code: "invalid_bitmask" };
  }

  const value = BigInt(candidate);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    return { ok: false, code: "unsafe_integer" };
  }

  return Number(value);
}

function isNullableSafeInteger(value: unknown): value is number | null {
  return value === null || isSafeInteger(value);
}

function hasFlag(flags: number, flag: number) {
  return (flags & flag) !== 0;
}

function deriveState(
  active: boolean,
  writable: boolean,
  readSupported: boolean,
  flags: number,
  structurallySupported: boolean,
): DescriptorControlState {
  const disabled = hasFlag(flags, CONTROL_FLAG.disabled);
  const inactive = hasFlag(flags, CONTROL_FLAG.inactive);
  const readOnly = hasFlag(flags, CONTROL_FLAG.readOnly);
  const grabbed = hasFlag(flags, CONTROL_FLAG.grabbed);
  const effectiveActive = active && !disabled && !inactive;

  return {
    backendActive: active,
    backendWritable: writable,
    backendReadSupported: readSupported,
    active: effectiveActive,
    writable:
      writable &&
      effectiveActive &&
      !readOnly &&
      !grabbed &&
      structurallySupported,
    readSupported,
    disabled,
    inactive,
    readOnly,
    grabbed,
  };
}

function safeMetadata(input: UnknownRecord): DescriptorSafeMetadata {
  const metadata: DescriptorSafeMetadata = {};

  if (isSafeInteger(input.id) && input.id >= 0) {
    metadata.id = input.id;
  }
  if (
    typeof input.serialized_id === "string" &&
    /^0x[0-9a-f]{8}$/.test(input.serialized_id)
  ) {
    metadata.serialized_id = input.serialized_id;
  }
  if (typeof input.name === "string") {
    metadata.name = input.name;
  }
  if (isSafeInteger(input.control_class) && input.control_class >= 0) {
    metadata.control_class = input.control_class;
  }
  if (isSafeInteger(input.control_type) && input.control_type >= 0) {
    metadata.control_type = input.control_type;
  }
  if (
    typeof input.active === "boolean" &&
    typeof input.writable === "boolean" &&
    typeof input.read_supported === "boolean" &&
    isSafeInteger(input.flags) &&
    input.flags >= 0
  ) {
    metadata.state = deriveState(
      input.active,
      input.writable,
      input.read_supported,
      input.flags,
      false,
    );
  }

  return metadata;
}

function unsupported(
  input: UnknownRecord,
  reason: DescriptorNormalizationReason,
): DescriptorNormalizationResult {
  return { ok: false, reason, safeMetadata: safeMetadata(input) };
}

function parseMenuItems(
  value: unknown,
  controlType: number,
): CameraControlMenuItem[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const indexes = new Set<number>();
  const items: CameraControlMenuItem[] = [];

  for (const item of value) {
    if (
      !isRecord(item) ||
      Object.keys(item).some(
        (key) => key !== "index" && key !== "value" && key !== "label",
      ) ||
      !isSafeInteger(item.index) ||
      item.index < 0 ||
      indexes.has(item.index) ||
      !isNullableSafeInteger(item.value) ||
      typeof item.label !== "string"
    ) {
      return null;
    }

    if (
      (controlType === CONTROL_TYPE.menu && item.value !== null) ||
      (controlType === CONTROL_TYPE.integerMenu && item.value === null)
    ) {
      return null;
    }

    indexes.add(item.index);
    items.push({ index: item.index, value: item.value, label: item.label });
  }

  return items;
}

function isSafeScalar(value: unknown): value is CameraControlValue {
  return (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string" ||
    isSafeInteger(value)
  );
}

function scalarMatchesType(
  controlType: number,
  value: CameraControlValue,
): boolean {
  switch (controlType) {
    case CONTROL_TYPE.boolean:
      return typeof value === "boolean";
    case CONTROL_TYPE.integer:
    case CONTROL_TYPE.menu:
    case CONTROL_TYPE.integerMenu:
    case CONTROL_TYPE.bitmask:
      return typeof value === "number";
    case CONTROL_TYPE.button:
      return value === null;
    case CONTROL_TYPE.string:
      return typeof value === "string";
    default:
      return false;
  }
}

function numericValueIsValid(
  value: CameraControlValue,
  minimum: number,
  maximum: number,
  step: number,
) {
  return (
    typeof value === "number" &&
    value >= minimum &&
    value <= maximum &&
    (BigInt(value) - BigInt(minimum)) % BigInt(step) === 0n
  );
}

function elementShapeIsValid(
  controlType: number,
  maximum: number | null,
  elementSize: number,
  elementCount: number,
  dimensions: number[],
) {
  if (elementCount !== 1 || dimensions.length !== 0) {
    return false;
  }

  if (controlType === CONTROL_TYPE.string) {
    return maximum !== null && elementSize === maximum + 1;
  }

  return elementSize === 4;
}

function typeSpecificShapeIsValid(
  descriptor: Omit<CameraControlDescriptor, "structurally_supported" | "state">,
) {
  const {
    control_type: controlType,
    minimum,
    maximum,
    step,
    default_value: defaultValue,
    current_value: currentValue,
    menu_items: menuItems,
  } = descriptor;

  if (
    !scalarMatchesType(controlType, defaultValue) ||
    (currentValue === null && !descriptor.read_supported
      ? false
      : !scalarMatchesType(controlType, currentValue))
  ) {
    return false;
  }

  if (
    controlType === CONTROL_TYPE.integer ||
    controlType === CONTROL_TYPE.menu ||
    controlType === CONTROL_TYPE.integerMenu
  ) {
    if (
      minimum === null ||
      maximum === null ||
      step === null ||
      minimum > maximum ||
      step <= 0
    ) {
      return false;
    }
    if (
      !numericValueIsValid(defaultValue, minimum, maximum, step) ||
      (currentValue !== null &&
        !numericValueIsValid(currentValue, minimum, maximum, step))
    ) {
      return false;
    }
  }

  if (
    controlType === CONTROL_TYPE.menu ||
    controlType === CONTROL_TYPE.integerMenu
  ) {
    const availableIndexes = new Set(menuItems.map((item) => item.index));
    if (
      menuItems.length === 0 ||
      !availableIndexes.has(defaultValue as number) ||
      (currentValue !== null && !availableIndexes.has(currentValue as number))
    ) {
      return false;
    }
  } else if (controlType !== CONTROL_TYPE.bitmask && menuItems.length !== 0) {
    return false;
  }

  return true;
}

export function normalizeCameraControlDescriptor(
  input: unknown,
): DescriptorNormalizationResult {
  if (!isRecord(input)) {
    return {
      ok: false,
      reason: "malformed_descriptor",
      safeMetadata: {},
    };
  }

  if (Object.keys(input).some((key) => !DESCRIPTOR_KEYS.has(key))) {
    return unsupported(input, "malformed_descriptor");
  }
  if (
    !isSafeInteger(input.id) ||
    input.id < 0 ||
    !isSafeInteger(input.control_class) ||
    input.control_class < 0 ||
    !isSafeInteger(input.control_type) ||
    input.control_type < 0 ||
    !isSafeInteger(input.flags) ||
    input.flags < 0 ||
    !isSafeInteger(input.element_size) ||
    input.element_size < 0 ||
    !isSafeInteger(input.element_count) ||
    input.element_count < 0 ||
    !Array.isArray(input.dimensions) ||
    input.dimensions.some(
      (dimension) => !isSafeInteger(dimension) || dimension < 0,
    )
  ) {
    return unsupported(input, "unsafe_integer");
  }
  if (
    typeof input.serialized_id !== "string" ||
    !/^0x[0-9a-f]{8}$/.test(input.serialized_id) ||
    Number.parseInt(input.serialized_id.slice(2), 16) !== input.id
  ) {
    return unsupported(input, "invalid_serialized_id");
  }
  if (
    typeof input.name !== "string" ||
    typeof input.active !== "boolean" ||
    typeof input.writable !== "boolean" ||
    typeof input.read_supported !== "boolean" ||
    !isNullableSafeInteger(input.minimum) ||
    !isNullableSafeInteger(input.maximum) ||
    !isNullableSafeInteger(input.step)
  ) {
    return unsupported(input, "malformed_descriptor");
  }

  const supportedTypes = new Set<number>([
    CONTROL_TYPE.integer,
    CONTROL_TYPE.boolean,
    CONTROL_TYPE.menu,
    CONTROL_TYPE.button,
    CONTROL_TYPE.string,
    CONTROL_TYPE.bitmask,
    CONTROL_TYPE.integerMenu,
  ]);
  if (!supportedTypes.has(input.control_type)) {
    return unsupported(input, "unsupported_control_type");
  }
  if (
    hasFlag(input.flags, CONTROL_FLAG.hasPayload) &&
    input.control_type !== CONTROL_TYPE.string
  ) {
    return unsupported(input, "payload_not_supported");
  }
  if (
    !elementShapeIsValid(
      input.control_type,
      input.maximum,
      input.element_size,
      input.element_count,
      input.dimensions,
    )
  ) {
    return unsupported(input, "unsupported_element_shape");
  }

  const menuItems = parseMenuItems(input.menu_items, input.control_type);
  if (menuItems === null) {
    return unsupported(input, "invalid_menu_items");
  }
  if (
    !isSafeScalar(input.default_value) ||
    !isSafeScalar(input.current_value)
  ) {
    return unsupported(input, "invalid_scalar_value");
  }

  const normalized = {
    id: input.id,
    serialized_id: input.serialized_id,
    name: input.name,
    control_class: input.control_class,
    control_type: input.control_type,
    minimum: input.minimum,
    maximum: input.maximum,
    step: input.step,
    default_value: input.default_value,
    current_value: input.current_value,
    menu_items: menuItems,
    flags: input.flags,
    element_size: input.element_size,
    element_count: input.element_count,
    dimensions: input.dimensions as number[],
    active: input.active,
    writable: input.writable,
    read_supported: input.read_supported,
  };

  if (!typeSpecificShapeIsValid(normalized)) {
    return unsupported(input, "invalid_scalar_value");
  }

  return {
    ok: true,
    descriptor: {
      ...normalized,
      structurally_supported: true,
      state: deriveState(
        input.active,
        input.writable,
        input.read_supported,
        input.flags,
        true,
      ),
    },
  };
}

export function getDescriptorEditorKind(
  descriptor: CameraControlDescriptor,
): DescriptorEditorKind {
  switch (descriptor.control_type) {
    case CONTROL_TYPE.boolean:
      return "boolean";
    case CONTROL_TYPE.integer:
      return "integer";
    case CONTROL_TYPE.menu:
      return "menu";
    case CONTROL_TYPE.integerMenu:
      return "integer-menu";
    case CONTROL_TYPE.button:
      return "button";
    case CONTROL_TYPE.string:
      return "string";
    case CONTROL_TYPE.bitmask:
      return descriptor.menu_items.length > 0
        ? "labeled-bitmask"
        : "numeric-bitmask";
    default:
      return "unsupported";
  }
}

export function validateDescriptorValue(
  descriptor: CameraControlDescriptor,
  candidate: unknown,
): DescriptorValidationResult {
  if (!descriptor.state.active || !descriptor.state.writable) {
    return { ok: false, code: "control_not_editable" };
  }

  switch (descriptor.control_type) {
    case CONTROL_TYPE.boolean:
      return typeof candidate === "boolean"
        ? { ok: true, value: candidate }
        : { ok: false, code: "invalid_type" };
    case CONTROL_TYPE.integer: {
      const value = validIntegerCandidate(candidate);
      if (isValidationResult(value)) {
        return value;
      }
      if (isOutsideBounds(value, descriptor.minimum, descriptor.maximum)) {
        return { ok: false, code: "out_of_range" };
      }

      const step =
        descriptor.step !== null && descriptor.step > 0 ? descriptor.step : 1;
      const minimum = descriptor.minimum ?? 0;
      if ((BigInt(value) - BigInt(minimum)) % BigInt(step) !== 0n) {
        return { ok: false, code: "step_mismatch" };
      }

      return { ok: true, value };
    }
    case CONTROL_TYPE.menu:
    case CONTROL_TYPE.integerMenu: {
      const value = validIntegerCandidate(candidate);
      if (isValidationResult(value)) {
        return value;
      }

      const found = descriptor.menu_items.some((item) =>
        descriptor.control_type === CONTROL_TYPE.menu
          ? item.index === value
          : item.value === value,
      );
      return found
        ? { ok: true, value }
        : { ok: false, code: "menu_value_not_found" };
    }
    case CONTROL_TYPE.button:
      return candidate === null
        ? { ok: true, value: null }
        : { ok: false, code: "invalid_type" };
    case CONTROL_TYPE.string: {
      if (typeof candidate !== "string") {
        return { ok: false, code: "invalid_type" };
      }

      const length = Array.from(candidate).length;
      if (isOutsideBounds(length, descriptor.minimum, descriptor.maximum)) {
        return { ok: false, code: "invalid_string_length" };
      }

      return { ok: true, value: candidate };
    }
    case CONTROL_TYPE.bitmask: {
      const value = parseBitmaskCandidate(candidate);
      if (isValidationResult(value)) {
        return value;
      }
      if (isOutsideBounds(value, descriptor.minimum, descriptor.maximum)) {
        return { ok: false, code: "out_of_range" };
      }

      return { ok: true, value };
    }
    default:
      return { ok: false, code: "unsupported_type" };
  }
}
