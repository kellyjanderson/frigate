import type {
  CameraControlDescriptor,
  DescriptorCommitCallback,
  DescriptorCommitState,
  DescriptorNormalizationResult,
} from "@/types/cameraControls";
import {
  getDescriptorEditorKind,
  normalizeCameraControlDescriptor,
  validateDescriptorValue,
} from "./cameraControlDescriptors";
import { describe, expect, it } from "vitest";

function integerDescriptor(overrides: Record<string, unknown> = {}) {
  return {
    id: 0x00980900,
    serialized_id: "0x00980900",
    name: "Brightness",
    control_class: 0x00980000,
    control_type: 1,
    minimum: 0,
    maximum: 255,
    step: 1,
    default_value: 128,
    current_value: 129,
    menu_items: [],
    flags: 0,
    element_size: 4,
    element_count: 1,
    dimensions: [],
    active: true,
    writable: true,
    read_supported: true,
    ...overrides,
  };
}

const requiredFields = Object.keys(integerDescriptor());

function withoutField(field: string) {
  const descriptor = integerDescriptor();
  delete descriptor[field as keyof typeof descriptor];
  return descriptor;
}

function requireDescriptor(result: DescriptorNormalizationResult) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected a descriptor, received ${result.reason}`);
  }
  return result.descriptor;
}

function consumePublicResult(result: DescriptorNormalizationResult): string {
  if (!result.ok) {
    return `${result.reason}:${result.safeMetadata.serialized_id ?? "unknown"}`;
  }

  const descriptor: CameraControlDescriptor = result.descriptor;
  return `${descriptor.serialized_id}:${descriptor.state.writable}`;
}

describe("camera control descriptor normalization", () => {
  it("normalizes the complete integer wire contract through the public seam", () => {
    const result = normalizeCameraControlDescriptor(integerDescriptor());
    const descriptor = requireDescriptor(result);

    expect(descriptor).toEqual({
      ...integerDescriptor(),
      structurally_supported: true,
      state: {
        backendActive: true,
        backendWritable: true,
        backendReadSupported: true,
        active: true,
        writable: true,
        readSupported: true,
        disabled: false,
        inactive: false,
        readOnly: false,
        grabbed: false,
      },
    });
    expect(consumePublicResult(result)).toBe("0x00980900:true");
  });

  it.each([
    [
      "boolean",
      integerDescriptor({
        control_type: 2,
        name: "Auto exposure",
        minimum: 0,
        maximum: 1,
        default_value: true,
        current_value: false,
      }),
    ],
    [
      "button",
      integerDescriptor({
        control_type: 4,
        name: "Trigger",
        minimum: null,
        maximum: null,
        step: null,
        default_value: null,
        current_value: null,
      }),
    ],
    [
      "string payload with a lossless scalar",
      integerDescriptor({
        control_type: 7,
        name: "Label",
        minimum: 0,
        maximum: 63,
        step: 1,
        default_value: "",
        current_value: "camera",
        flags: 0x0100,
        element_size: 64,
        element_count: 1,
      }),
    ],
    [
      "unlabeled bitmask",
      integerDescriptor({
        control_type: 8,
        name: "Mask",
        minimum: 0,
        maximum: 255,
        default_value: 1,
        current_value: 5,
      }),
    ],
    [
      "labeled bitmask",
      integerDescriptor({
        control_type: 8,
        name: "Mask",
        minimum: 0,
        maximum: 255,
        default_value: 1,
        current_value: 5,
        menu_items: [
          { index: 0, value: 1, label: "First" },
          { index: 2, value: 4, label: "Third" },
        ],
      }),
    ],
  ])("supports %s descriptors", (_name, fixture) => {
    expect(normalizeCameraControlDescriptor(fixture).ok).toBe(true);
  });

  it("preserves sparse ordinary and integer menus in source order", () => {
    const ordinary = requireDescriptor(
      normalizeCameraControlDescriptor(
        integerDescriptor({
          control_type: 3,
          name: "Mode",
          minimum: 0,
          maximum: 4,
          default_value: 0,
          current_value: 4,
          menu_items: [
            { index: 4, value: null, label: "Manual" },
            { index: 0, value: null, label: "Auto" },
          ],
        }),
      ),
    );
    const integerMenu = requireDescriptor(
      normalizeCameraControlDescriptor(
        integerDescriptor({
          control_type: 9,
          name: "Frequency",
          minimum: 1,
          maximum: 5,
          default_value: 1,
          current_value: 5,
          menu_items: [
            { index: 1, value: 50, label: "50 Hz" },
            { index: 5, value: 60, label: "60 Hz" },
          ],
        }),
      ),
    );

    expect(ordinary.menu_items.map(({ index }) => index)).toEqual([4, 0]);
    expect(integerMenu.menu_items[1]).toEqual({
      index: 5,
      value: 60,
      label: "60 Hz",
    });
  });

  it("preserves the complete reported flag bitset", () => {
    const descriptor = requireDescriptor(
      normalizeCameraControlDescriptor(
        integerDescriptor({
          control_type: 7,
          minimum: 0,
          maximum: 63,
          default_value: "",
          current_value: "camera",
          flags: 0x07ff,
          element_size: 64,
          element_count: 1,
        }),
      ),
    );

    expect(descriptor.flags).toBe(0x07ff);
    expect(descriptor.state).toMatchObject({
      disabled: true,
      inactive: true,
      readOnly: true,
      grabbed: true,
      writable: false,
    });
  });

  it("accepts lossless safe-integer boundaries", () => {
    const descriptor = requireDescriptor(
      normalizeCameraControlDescriptor(
        integerDescriptor({
          minimum: Number.MIN_SAFE_INTEGER,
          maximum: Number.MAX_SAFE_INTEGER,
          default_value: Number.MIN_SAFE_INTEGER,
          current_value: Number.MAX_SAFE_INTEGER,
        }),
      ),
    );

    expect(descriptor.minimum).toBe(Number.MIN_SAFE_INTEGER);
    expect(descriptor.current_value).toBe(Number.MAX_SAFE_INTEGER);
  });

  it.each([
    ["disabled", 0x0001, "disabled"],
    ["inactive", 0x0010, "inactive"],
    ["read-only", 0x0004, "readOnly"],
    ["grabbed", 0x0002, "grabbed"],
  ])("lets the %s flag reduce backend capability", (_name, flags, reason) => {
    const descriptor = requireDescriptor(
      normalizeCameraControlDescriptor(integerDescriptor({ flags })),
    );

    expect(descriptor.state.writable).toBe(false);
    expect(descriptor.state[reason as keyof typeof descriptor.state]).toBe(
      true,
    );
  });

  it("never infers backend capabilities", () => {
    const descriptor = requireDescriptor(
      normalizeCameraControlDescriptor(
        integerDescriptor({
          active: false,
          writable: false,
          read_supported: false,
          current_value: 129,
        }),
      ),
    );

    expect(descriptor.state).toMatchObject({
      backendActive: false,
      backendWritable: false,
      backendReadSupported: false,
      active: false,
      writable: false,
      readSupported: false,
    });
  });

  it("allows unavailable current state only when reads are unsupported", () => {
    expect(
      normalizeCameraControlDescriptor(
        integerDescriptor({ read_supported: false, current_value: null }),
      ).ok,
    ).toBe(true);
    expect(
      normalizeCameraControlDescriptor(
        integerDescriptor({ read_supported: true, current_value: null }),
      ),
    ).toMatchObject({ ok: false, reason: "invalid_scalar_value" });
  });

  it.each(requiredFields)("rejects a missing required %s field", (field) => {
    expect(normalizeCameraControlDescriptor(withoutField(field)).ok).toBe(
      false,
    );
  });

  it.each([
    ["id", "0x00980900"],
    ["serialized_id", 0x00980900],
    ["name", 7],
    ["control_class", "0x00980000"],
    ["control_type", "integer"],
    ["minimum", "0"],
    ["maximum", "255"],
    ["step", "1"],
    ["default_value", {}],
    ["current_value", []],
    ["menu_items", {}],
    ["flags", "0"],
    ["element_size", "4"],
    ["element_count", "1"],
    ["dimensions", {}],
    ["active", 1],
    ["writable", 1],
    ["read_supported", 1],
  ])("rejects a malformed %s field type", (field, value) => {
    expect(
      normalizeCameraControlDescriptor(integerDescriptor({ [field]: value }))
        .ok,
    ).toBe(false);
  });

  it("rejects a canonical serialized ID that does not match the numeric ID", () => {
    expect(
      normalizeCameraControlDescriptor(
        integerDescriptor({ serialized_id: "0x00980901" }),
      ),
    ).toMatchObject({ ok: false, reason: "invalid_serialized_id" });
  });

  it.each([
    ["non-array menu", {}],
    ["non-object item", ["Auto"]],
    ["unknown item field", [{ index: 0, value: null, label: "Auto", raw: 1 }]],
    ["missing index", [{ value: null, label: "Auto" }]],
    ["missing value", [{ index: 0, label: "Auto" }]],
    ["missing label", [{ index: 0, value: null }]],
    ["negative index", [{ index: -1, value: null, label: "Auto" }]],
    ["fractional index", [{ index: 0.5, value: null, label: "Auto" }]],
    ["unsafe index", [{ index: 2 ** 53, value: null, label: "Auto" }]],
    ["unsafe value", [{ index: 0, value: 2 ** 53, label: "Auto" }]],
    ["non-string label", [{ index: 0, value: null, label: 7 }]],
    ["ordinary menu value", [{ index: 0, value: 10, label: "Auto" }]],
  ])("rejects malformed ordinary menu items: %s", (_name, menuItems) => {
    expect(
      normalizeCameraControlDescriptor(
        integerDescriptor({
          control_type: 3,
          minimum: 0,
          maximum: 0,
          default_value: 0,
          current_value: 0,
          menu_items: menuItems,
        }),
      ),
    ).toMatchObject({ ok: false, reason: "invalid_menu_items" });
  });

  it("rejects duplicate menu indexes", () => {
    expect(
      normalizeCameraControlDescriptor(
        integerDescriptor({
          control_type: 3,
          minimum: 0,
          maximum: 1,
          default_value: 0,
          current_value: 1,
          menu_items: [
            { index: 0, value: null, label: "Auto" },
            { index: 0, value: null, label: "Manual" },
          ],
        }),
      ),
    ).toMatchObject({ ok: false, reason: "invalid_menu_items" });
  });

  it.each([
    ["null value", null],
    ["fractional value", 50.5],
    ["unsafe value", 2 ** 53],
  ])("rejects integer-menu items with an invalid %s", (_name, value) => {
    expect(
      normalizeCameraControlDescriptor(
        integerDescriptor({
          control_type: 9,
          minimum: 0,
          maximum: 0,
          default_value: 0,
          current_value: 0,
          menu_items: [{ index: 0, value, label: "Frequency" }],
        }),
      ),
    ).toMatchObject({ ok: false, reason: "invalid_menu_items" });
  });

  it.each([
    ["boolean default", { control_type: 2, default_value: 0 }],
    ["boolean current", { control_type: 2, current_value: 0 }],
    ["integer default", { default_value: false }],
    ["integer current", { current_value: false }],
    ["menu default", { control_type: 3, default_value: "0" }],
    ["menu current", { control_type: 3, current_value: "0" }],
    ["button default", { control_type: 4, default_value: 0 }],
    ["button current", { control_type: 4, current_value: 0 }],
    [
      "string default",
      {
        control_type: 7,
        minimum: 0,
        maximum: 63,
        default_value: 0,
        current_value: "camera",
        element_size: 64,
      },
    ],
    [
      "string current",
      {
        control_type: 7,
        minimum: 0,
        maximum: 63,
        default_value: "",
        current_value: 0,
        element_size: 64,
      },
    ],
    ["bitmask default", { control_type: 8, default_value: false }],
    ["bitmask current", { control_type: 8, current_value: false }],
    ["integer-menu default", { control_type: 9, default_value: null }],
    ["integer-menu current", { control_type: 9, current_value: null }],
  ])("rejects a scalar/type contradiction: %s", (_name, overrides) => {
    expect(
      normalizeCameraControlDescriptor(integerDescriptor(overrides)),
    ).toMatchObject({ ok: false, reason: "invalid_scalar_value" });
  });

  it.each([
    ["integer", {}],
    ["boolean", { control_type: 2, default_value: true, current_value: false }],
    [
      "menu",
      {
        control_type: 3,
        minimum: 0,
        maximum: 0,
        default_value: 0,
        current_value: 0,
        menu_items: [{ index: 0, value: null, label: "Auto" }],
      },
    ],
    [
      "button",
      {
        control_type: 4,
        minimum: null,
        maximum: null,
        step: null,
        default_value: null,
        current_value: null,
      },
    ],
    ["bitmask", { control_type: 8, default_value: 1, current_value: 5 }],
    [
      "integer-menu",
      {
        control_type: 9,
        minimum: 0,
        maximum: 0,
        default_value: 0,
        current_value: 0,
        menu_items: [{ index: 0, value: 50, label: "50 Hz" }],
      },
    ],
  ])("rejects zero element metadata for %s", (_name, overrides) => {
    expect(
      normalizeCameraControlDescriptor(
        integerDescriptor({ ...overrides, element_size: 0 }),
      ),
    ).toMatchObject({ ok: false, reason: "unsupported_element_shape" });
    expect(
      normalizeCameraControlDescriptor(
        integerDescriptor({ ...overrides, element_count: 0 }),
      ),
    ).toMatchObject({ ok: false, reason: "unsupported_element_shape" });
  });

  it.each([
    ["zero element size", { element_size: 0 }],
    ["zero element count", { element_count: 0 }],
    ["multiple scalar elements", { element_count: 2 }],
    ["unexpected scalar element size", { element_size: 8 }],
    ["zero dimension", { dimensions: [0] }],
    ["positive dimension", { dimensions: [1] }],
  ])("rejects invalid scalar element metadata: %s", (_name, overrides) => {
    expect(
      normalizeCameraControlDescriptor(integerDescriptor(overrides)),
    ).toMatchObject({ ok: false, reason: "unsupported_element_shape" });
  });

  it.each([
    ["zero element size", { element_size: 0 }],
    ["zero element count", { element_count: 0 }],
    ["multiple string elements", { element_count: 64 }],
    ["size unequal to maximum plus one", { element_size: 63 }],
    ["dimensioned string", { dimensions: [64] }],
  ])("rejects invalid string element metadata: %s", (_name, overrides) => {
    expect(
      normalizeCameraControlDescriptor(
        integerDescriptor({
          control_type: 7,
          name: "Label",
          minimum: 0,
          maximum: 63,
          step: 1,
          default_value: "",
          current_value: "camera",
          flags: 0x0100,
          element_size: 64,
          element_count: 1,
          ...overrides,
        }),
      ),
    ).toMatchObject({ ok: false, reason: "unsupported_element_shape" });
  });

  it.each([
    ["reversed range", { minimum: 10, maximum: 1 }],
    ["zero step", { step: 0 }],
    ["negative step", { step: -1 }],
    ["default below range", { default_value: -1 }],
    ["default above range", { default_value: 256 }],
    ["current below range", { current_value: -1 }],
    ["current above range", { current_value: 256 }],
    ["default off step", { step: 2, default_value: 127 }],
    ["current off step", { step: 2, current_value: 129 }],
  ])(
    "rejects integer range/default/current contradiction: %s",
    (_name, overrides) => {
      expect(
        normalizeCameraControlDescriptor(integerDescriptor(overrides)),
      ).toMatchObject({ ok: false, reason: "invalid_scalar_value" });
    },
  );

  it.each([
    ["default absent from menu", { default_value: 1 }],
    ["current absent from menu", { current_value: 1 }],
  ])("rejects menu selection contradiction: %s", (_name, overrides) => {
    expect(
      normalizeCameraControlDescriptor(
        integerDescriptor({
          control_type: 3,
          minimum: 0,
          maximum: 1,
          default_value: 0,
          current_value: 0,
          menu_items: [{ index: 0, value: null, label: "Auto" }],
          ...overrides,
        }),
      ),
    ).toMatchObject({ ok: false, reason: "invalid_scalar_value" });
  });

  it.each([
    ["integer64", { control_type: 5 }, "unsupported_control_type"],
    ["unknown", { control_type: 99 }, "unsupported_control_type"],
    ["payload", { flags: 0x0100 }, "payload_not_supported"],
    ["compound", { dimensions: [2, 2] }, "unsupported_element_shape"],
    ["array", { element_count: 4 }, "unsupported_element_shape"],
  ])("fails closed for %s descriptors", (_name, overrides, reason) => {
    const result = normalizeCameraControlDescriptor(
      integerDescriptor(overrides),
    );

    expect(result).toMatchObject({
      ok: false,
      reason,
      safeMetadata: {
        serialized_id: "0x00980900",
        state: { writable: false },
      },
    });
  });

  it.each([
    [
      "noncanonical ID",
      { serialized_id: "0X00980900" },
      "invalid_serialized_id",
    ],
    ["unsafe integer", { current_value: 2 ** 53 }, "invalid_scalar_value"],
    ["wrong scalar", { current_value: "129" }, "invalid_scalar_value"],
    [
      "duplicate menu index",
      {
        control_type: 3,
        minimum: 0,
        maximum: 1,
        default_value: 0,
        current_value: 1,
        menu_items: [
          { index: 0, value: null, label: "Auto" },
          { index: 0, value: null, label: "Manual" },
        ],
      },
      "invalid_menu_items",
    ],
    ["invalid range", { minimum: 10, maximum: 1 }, "invalid_scalar_value"],
  ])("rejects %s", (_name, overrides, reason) => {
    expect(
      normalizeCameraControlDescriptor(integerDescriptor(overrides)),
    ).toMatchObject({
      ok: false,
      reason,
    });
  });

  it("omits raw privacy-sensitive content from unsupported results", () => {
    const result = normalizeCameraControlDescriptor({
      ...integerDescriptor({ control_type: 99 }),
      raw_payload: [1, 2, 3],
      device_path: "/dev/video-secret",
      ioctl: { bytes: "secret" },
      authorization: "Bearer secret",
      raw_exception: "private failure",
    });

    expect(result).toMatchObject({
      ok: false,
      safeMetadata: {
        id: 0x00980900,
        serialized_id: "0x00980900",
        name: "Brightness",
        control_type: 99,
        state: { writable: false },
      },
    });
    expect(JSON.stringify(result)).not.toMatch(
      /video-secret|bytes|Bearer|private failure|raw_payload|ioctl/,
    );
    expect(consumePublicResult(result)).toBe("malformed_descriptor:0x00980900");
  });
});

describe("camera control descriptor value policy", () => {
  function normalized(overrides: Record<string, unknown> = {}) {
    return requireDescriptor(
      normalizeCameraControlDescriptor(integerDescriptor(overrides)),
    );
  }

  it.each([
    ["integer", {}, "integer"],
    [
      "boolean",
      { control_type: 2, default_value: true, current_value: false },
      "boolean",
    ],
    [
      "menu",
      {
        control_type: 3,
        minimum: 0,
        maximum: 4,
        default_value: 0,
        current_value: 4,
        menu_items: [
          { index: 4, value: null, label: "Manual" },
          { index: 0, value: null, label: "Auto" },
        ],
      },
      "menu",
    ],
    [
      "integer menu",
      {
        control_type: 9,
        minimum: 1,
        maximum: 5,
        default_value: 1,
        current_value: 5,
        menu_items: [
          { index: 1, value: 50, label: "50 Hz" },
          { index: 5, value: 60, label: "60 Hz" },
        ],
      },
      "integer-menu",
    ],
    [
      "button",
      {
        control_type: 4,
        minimum: null,
        maximum: null,
        step: null,
        default_value: null,
        current_value: null,
      },
      "button",
    ],
    [
      "string",
      {
        control_type: 7,
        minimum: 0,
        maximum: 3,
        step: 1,
        default_value: "",
        current_value: "cam",
        flags: 0x0100,
        element_size: 4,
      },
      "string",
    ],
    [
      "labeled bitmask",
      {
        control_type: 8,
        default_value: 1,
        current_value: 5,
        menu_items: [{ index: 0, value: 1, label: "First" }],
      },
      "labeled-bitmask",
    ],
    [
      "numeric bitmask",
      { control_type: 8, default_value: 1, current_value: 5 },
      "numeric-bitmask",
    ],
  ])("maps a normalized %s descriptor to %s", (_name, fixture, expected) => {
    expect(getDescriptorEditorKind(normalized(fixture))).toBe(expected);
  });

  it("maps a defensively unmapped type to unsupported", () => {
    const descriptor = normalized();
    descriptor.control_type = 99;

    expect(getDescriptorEditorKind(descriptor)).toBe("unsupported");
    expect(validateDescriptorValue(descriptor, 10)).toEqual({
      ok: false,
      code: "unsupported_type",
    });
  });

  it.each([
    ["backend inactive", { active: false }],
    ["backend nonwritable", { writable: false }],
    ["disabled", { flags: 0x0001 }],
    ["inactive", { flags: 0x0010 }],
    ["read-only", { flags: 0x0004 }],
    ["grabbed", { flags: 0x0002 }],
  ])("retains editor kind but denies %s controls first", (_name, fixture) => {
    const descriptor = normalized(fixture);

    expect(getDescriptorEditorKind(descriptor)).toBe("integer");
    expect(validateDescriptorValue(descriptor, "not parsed")).toEqual({
      ok: false,
      code: "control_not_editable",
    });
  });

  it("accepts exact booleans and button null without coercion", () => {
    const boolean = normalized({
      control_type: 2,
      default_value: true,
      current_value: false,
    });
    const button = normalized({
      control_type: 4,
      minimum: null,
      maximum: null,
      step: null,
      default_value: null,
      current_value: null,
    });

    expect(validateDescriptorValue(boolean, false)).toEqual({
      ok: true,
      value: false,
    });
    expect(validateDescriptorValue(boolean, 0)).toEqual({
      ok: false,
      code: "invalid_type",
    });
    expect(validateDescriptorValue(button, null)).toEqual({
      ok: true,
      value: null,
    });
    expect(validateDescriptorValue(button, false)).toEqual({
      ok: false,
      code: "invalid_type",
    });
  });

  it.each([
    ["wrong type", "12", "invalid_type"],
    ["non-finite", Number.POSITIVE_INFINITY, "non_finite_integer"],
    ["fractional", 12.5, "non_finite_integer"],
    ["unsafe", Number.MAX_SAFE_INTEGER + 1, "unsafe_integer"],
    ["below minimum", 9, "out_of_range"],
    ["above maximum", 21, "out_of_range"],
    ["off step", 11, "step_mismatch"],
  ])("rejects an integer candidate that is %s", (_name, candidate, code) => {
    const descriptor = normalized({
      minimum: 10,
      maximum: 20,
      step: 2,
      default_value: 10,
      current_value: 12,
    });

    expect(validateDescriptorValue(descriptor, candidate)).toEqual({
      ok: false,
      code,
    });
  });

  it("accepts inclusive aligned integer bounds", () => {
    const descriptor = normalized({
      minimum: 10,
      maximum: 20,
      step: 2,
      default_value: 10,
      current_value: 12,
    });

    expect(validateDescriptorValue(descriptor, 10)).toEqual({
      ok: true,
      value: 10,
    });
    expect(validateDescriptorValue(descriptor, 20)).toEqual({
      ok: true,
      value: 20,
    });
  });

  it.each([
    ["missing", null],
    ["zero", 0],
    ["negative", -2],
  ])("defaults a %s integer step to one", (_name, step) => {
    const descriptor = {
      ...normalized({
        minimum: 10,
        maximum: 20,
        step: 2,
        default_value: 10,
        current_value: 12,
      }),
      step,
    } satisfies CameraControlDescriptor;

    expect(validateDescriptorValue(descriptor, 11)).toEqual({
      ok: true,
      value: 11,
    });
  });

  it("distinguishes sparse menu indexes from integer-menu values", () => {
    const menu = normalized({
      control_type: 3,
      minimum: 0,
      maximum: 4,
      default_value: 0,
      current_value: 4,
      menu_items: [
        { index: 4, value: null, label: "Manual" },
        { index: 0, value: null, label: "Auto" },
      ],
    });
    const integerMenu = normalized({
      control_type: 9,
      minimum: 1,
      maximum: 5,
      default_value: 1,
      current_value: 5,
      menu_items: [
        { index: 1, value: 50, label: "50 Hz" },
        { index: 5, value: 60, label: "60 Hz" },
      ],
    });

    expect(validateDescriptorValue(menu, 4)).toEqual({ ok: true, value: 4 });
    expect(validateDescriptorValue(menu, 1)).toEqual({
      ok: false,
      code: "menu_value_not_found",
    });
    expect(validateDescriptorValue(integerMenu, 60)).toEqual({
      ok: true,
      value: 60,
    });
    expect(validateDescriptorValue(integerMenu, 5)).toEqual({
      ok: false,
      code: "menu_value_not_found",
    });
  });

  it("preserves strings and validates Unicode code-point length", () => {
    const descriptor = normalized({
      control_type: 7,
      minimum: 1,
      maximum: 3,
      step: 1,
      default_value: "a",
      current_value: "cam",
      flags: 0x0100,
      element_size: 4,
    });

    expect(validateDescriptorValue(descriptor, " a ")).toEqual({
      ok: true,
      value: " a ",
    });
    expect(validateDescriptorValue(descriptor, "😀😀")).toEqual({
      ok: true,
      value: "😀😀",
    });
    expect(validateDescriptorValue(descriptor, "")).toEqual({
      ok: false,
      code: "invalid_string_length",
    });
    expect(validateDescriptorValue(descriptor, "four")).toEqual({
      ok: false,
      code: "invalid_string_length",
    });
    expect(validateDescriptorValue(descriptor, 1)).toEqual({
      ok: false,
      code: "invalid_type",
    });
  });

  it.each([
    [15, 15],
    ["15", 15],
    ["0x0f", 15],
    ["0X0F", 15],
  ])("parses a complete bitmask %j as %d", (candidate, expected) => {
    const descriptor = normalized({
      control_type: 8,
      minimum: 0,
      maximum: 255,
      default_value: 1,
      current_value: 5,
    });

    expect(validateDescriptorValue(descriptor, candidate)).toEqual({
      ok: true,
      value: expected,
    });
  });

  it.each([Number.MAX_SAFE_INTEGER, String(Number.MAX_SAFE_INTEGER)])(
    "accepts the safe-integer-limit bitmask %j",
    (candidate) => {
      const descriptor = normalized({
        control_type: 8,
        minimum: 0,
        maximum: Number.MAX_SAFE_INTEGER,
        default_value: 1,
        current_value: 5,
      });

      expect(validateDescriptorValue(descriptor, candidate)).toEqual({
        ok: true,
        value: Number.MAX_SAFE_INTEGER,
      });
    },
  );

  it.each([
    ["wrong type", {}, "invalid_type"],
    ["negative number", -1, "invalid_bitmask"],
    ["fractional number", 1.5, "invalid_bitmask"],
    ["signed string", "+1", "invalid_bitmask"],
    ["whitespace", " 1", "invalid_bitmask"],
    ["fraction", "1.5", "invalid_bitmask"],
    ["exponent", "1e2", "invalid_bitmask"],
    ["separator", "1_0", "invalid_bitmask"],
    ["empty hex", "0x", "invalid_bitmask"],
    ["trailing text", "0x1z", "invalid_bitmask"],
    ["unsafe number", Number.MAX_SAFE_INTEGER + 1, "unsafe_integer"],
    ["unsafe string", "9007199254740992", "unsafe_integer"],
    ["above bounds", 256, "out_of_range"],
  ])("rejects a bitmask with %s", (_name, candidate, code) => {
    const descriptor = normalized({
      control_type: 8,
      minimum: 0,
      maximum: 255,
      default_value: 1,
      current_value: 5,
    });

    expect(validateDescriptorValue(descriptor, candidate)).toEqual({
      ok: false,
      code,
    });
  });

  it.each([
    ["first", 0b001],
    ["third", 0b100],
  ])(
    "preserves unknown bits across clear/set transitions for the %s mask",
    (_name, selectedMask) => {
      const descriptor = normalized({
        control_type: 8,
        minimum: 0,
        maximum: 255,
        default_value: 1,
        current_value: 0b10000101,
        menu_items: [
          { index: 0, value: 1, label: "First" },
          { index: 2, value: 4, label: "Third" },
        ],
      });
      const authoritative = descriptor.current_value as number;
      const knownMasks = 0b001 | 0b100;
      const unknownSetBits = authoritative & ~knownMasks;
      const cleared = authoritative & ~selectedMask;
      const set = cleared | selectedMask;

      expect(cleared & ~knownMasks).toBe(unknownSetBits);
      expect(validateDescriptorValue(descriptor, cleared)).toEqual({
        ok: true,
        value: cleared,
      });
      expect(set & ~knownMasks).toBe(unknownSetBits);
      expect(validateDescriptorValue(descriptor, set)).toEqual({
        ok: true,
        value: authoritative,
      });
    },
  );

  it("emits one synchronous canonical commit intent only after validation", () => {
    const descriptor = normalized({ step: 2, current_value: 128 });
    const deniedDescriptor = normalized({ writable: false });
    const unsupportedDescriptor = normalized();
    unsupportedDescriptor.control_type = 99;
    const intents: Array<[string, unknown]> = [];
    const commit: DescriptorCommitCallback = (controlId, value) => {
      intents.push([controlId, value]);
    };

    function validateAndCommit(
      target: CameraControlDescriptor,
      candidate: unknown,
    ) {
      const result = validateDescriptorValue(target, candidate);
      if (result.ok) {
        return commit(target.serialized_id, result.value);
      }
    }

    expect(validateAndCommit(descriptor, 130)).toBeUndefined();
    validateAndCommit(descriptor, 131);
    validateAndCommit(deniedDescriptor, 130);
    validateAndCommit(unsupportedDescriptor, 130);

    expect(intents).toEqual([["0x00980900", 130]]);
  });

  it("keeps authoritative values caller-controlled across commit states", () => {
    const states: DescriptorCommitState[] = [
      { status: "idle", authoritativeValue: 10 },
      { status: "pending", authoritativeValue: 10, submittedValue: 12 },
      { status: "success", authoritativeValue: 11, submittedValue: 12 },
      { status: "success", authoritativeValue: 12, submittedValue: 12 },
      {
        status: "error",
        authoritativeValue: 10,
        submittedValue: 12,
        code: "write_failed",
        message: "Control update failed",
      },
    ];

    expect(states.map(({ authoritativeValue }) => authoritativeValue)).toEqual([
      10, 10, 11, 12, 10,
    ]);
    expect(JSON.stringify(states.at(-1))).not.toMatch(
      /dev\/video|ioctl|Bearer|raw_exception/,
    );
  });
});
