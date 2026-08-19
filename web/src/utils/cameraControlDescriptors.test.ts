import type {
  CameraControlDescriptor,
  DescriptorNormalizationResult,
} from "@/types/cameraControls";
import { normalizeCameraControlDescriptor } from "./cameraControlDescriptors";
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
        element_size: 1,
        element_count: 64,
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
          element_size: 1,
          element_count: 64,
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
