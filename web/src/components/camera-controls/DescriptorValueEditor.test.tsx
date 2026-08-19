import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type {
  CameraControlDescriptor,
  CameraControlValue,
  DescriptorCommitState,
  DescriptorValidationCode,
} from "@/types/cameraControls";
import {
  DescriptorValueEditor,
  type DescriptorValueEditorProps,
} from "./DescriptorValueEditor";

const roots: Root[] = [];

beforeAll(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock;
});

afterEach(() => {
  while (roots.length > 0) {
    act(() => roots.pop()?.unmount());
  }
  document.body.replaceChildren();
});

function descriptor(
  overrides: Partial<CameraControlDescriptor> = {},
): CameraControlDescriptor {
  const state = {
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
    ...overrides.state,
  };
  return {
    id: 0x00980900,
    serialized_id: "0x00980900",
    name: "Brightness",
    control_class: 0x00980000,
    control_type: 1,
    minimum: 0,
    maximum: 100,
    step: 1,
    default_value: 50,
    current_value: 10,
    menu_items: [],
    flags: 0,
    element_size: 4,
    element_count: 1,
    dimensions: [],
    active: true,
    writable: true,
    read_supported: true,
    structurally_supported: true,
    ...overrides,
    state,
  };
}

function idle(authoritativeValue: CameraControlValue): DescriptorCommitState {
  return { status: "idle", authoritativeValue };
}

function renderEditor(
  descriptorValue: CameraControlDescriptor,
  commitState: DescriptorCommitState = idle(descriptorValue.current_value),
) {
  const onCommit = vi.fn();
  const onValidationChange = vi.fn();
  const container = document.createElement("div");
  const label = document.createElement("span");
  const description = document.createElement("span");
  label.id = "control-label";
  description.id = "control-description";
  document.body.append(label, description, container);
  const root = createRoot(container);
  roots.push(root);
  let props: DescriptorValueEditorProps = {
    descriptor: descriptorValue,
    commitState,
    ariaLabelledBy: label.id,
    ariaDescribedBy: description.id,
    unsupportedDescription: "This control cannot be edited",
    onCommit,
    onValidationChange,
  };
  const rerender = (overrides: Partial<DescriptorValueEditorProps> = {}) => {
    props = { ...props, ...overrides };
    act(() => root.render(<DescriptorValueEditor {...props} />));
  };
  rerender();
  return { container, rerender, root, onCommit, onValidationChange };
}

function setInput(input: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function press(target: Element, key: string) {
  act(() => {
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
  });
}

function blur(target: HTMLElement) {
  act(() => {
    target.focus();
    target.blur();
  });
}

function click(target: Element) {
  act(() => {
    target.dispatchEvent(
      new MouseEvent("click", { bubbles: true, button: 0, cancelable: true }),
    );
  });
}

describe("DescriptorValueEditor", () => {
  it("renders every supported editor kind with accessible, contained targets", () => {
    const fixtures: Array<{
      descriptor: CameraControlDescriptor;
      selector: string;
    }> = [
      {
        descriptor: descriptor({
          control_type: 2,
          minimum: 0,
          maximum: 1,
          default_value: false,
          current_value: true,
        }),
        selector: "button[role=switch]",
      },
      { descriptor: descriptor(), selector: "input[inputmode=numeric]" },
      {
        descriptor: descriptor({
          control_type: 3,
          minimum: 0,
          maximum: 4,
          current_value: 4,
          menu_items: [
            { index: 0, value: null, label: "Auto" },
            { index: 4, value: null, label: "Manual" },
          ],
        }),
        selector: "button[role=combobox]",
      },
      {
        descriptor: descriptor({
          control_type: 9,
          minimum: 1,
          maximum: 5,
          current_value: 5,
          menu_items: [
            { index: 1, value: 50, label: "50 Hz" },
            { index: 5, value: 60, label: "60 Hz" },
          ],
        }),
        selector: "button[role=combobox]",
      },
      {
        descriptor: descriptor({
          control_type: 4,
          minimum: null,
          maximum: null,
          step: null,
          default_value: null,
          current_value: null,
        }),
        selector: "button:not([role])",
      },
      {
        descriptor: descriptor({
          control_type: 7,
          minimum: 0,
          maximum: 20,
          default_value: "",
          current_value: "camera",
          element_size: 21,
        }),
        selector: "input[inputmode=text]",
      },
      {
        descriptor: descriptor({
          control_type: 8,
          minimum: 0,
          maximum: 255,
          default_value: 1,
          current_value: 5,
          menu_items: [{ index: 0, value: 1, label: "First bit" }],
        }),
        selector: "button[role=checkbox]",
      },
      {
        descriptor: descriptor({
          control_type: 8,
          minimum: 0,
          maximum: 255,
          default_value: 1,
          current_value: 5,
        }),
        selector: "input[inputmode=text]",
      },
    ];

    for (const fixture of fixtures) {
      const harness = renderEditor(fixture.descriptor);
      const target = harness.container.querySelector(fixture.selector);
      expect(target).not.toBeNull();
      expect(target?.getAttribute("aria-labelledby")).toContain(
        "control-label",
      );
      expect(target?.getAttribute("aria-describedby")).toBe(
        "control-description",
      );
      expect(target?.className).toMatch(/h-11|size-11/);
      act(() => harness.root.unmount());
      roots.splice(roots.indexOf(harness.root), 1);
      harness.container.remove();
    }
  });

  it("renders unsupported shapes as safe inert content", () => {
    const unsupported = {
      ...descriptor(),
      control_type: 99,
      element_count: 4,
      dimensions: [4],
    } as CameraControlDescriptor;
    const { container, onCommit } = renderEditor(unsupported);

    expect(container.textContent).toContain("This control cannot be edited");
    expect(container.querySelector("input, button, [tabindex]")).toBeNull();
    expect(container.querySelector("[role]")).toBeNull();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("validates exact integers and deduplicates Enter followed by blur", () => {
    const { container, onCommit, onValidationChange } = renderEditor(
      descriptor({ minimum: 10, maximum: 20, step: 2, current_value: 12 }),
    );
    const input = container.querySelector("input") as HTMLInputElement;

    setInput(input, "18");
    press(input, "Enter");
    blur(input);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenLastCalledWith("0x00980900", 18);

    setInput(input, "11");
    press(input, "Enter");
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onValidationChange).toHaveBeenLastCalledWith(
      "0x00980900",
      "step_mismatch",
    );
    expect(input.getAttribute("aria-invalid")).toBe("true");

    press(input, "Escape");
    expect(input.value).toBe("12");
    expect(onValidationChange).toHaveBeenLastCalledWith("0x00980900", null);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("keeps the slider through 1,000 intervals and always keeps exact entry", () => {
    const harness = renderEditor(
      descriptor({ minimum: 0, maximum: 1000, step: 1 }),
    );
    expect(harness.container.querySelector("[role=slider]")).not.toBeNull();
    expect(harness.container.querySelector("input")).not.toBeNull();

    const large = descriptor({ minimum: 0, maximum: 1001, step: 1 });
    harness.rerender({ descriptor: large, commitState: idle(10) });
    expect(harness.container.querySelector("[role=slider]")).toBeNull();
    expect(harness.container.querySelector("input")).not.toBeNull();
  });

  it("uses step, page, and bound semantics on the touch-enabled slider", () => {
    const harness = renderEditor(
      descriptor({ minimum: 0, maximum: 100, step: 1, current_value: 10 }),
    );
    const thumb = harness.container.querySelector("[role=slider]") as Element;

    press(thumb, "ArrowRight");
    expect(harness.onCommit).toHaveBeenLastCalledWith("0x00980900", 11);
    press(thumb, "PageUp");
    expect(harness.onCommit).toHaveBeenLastCalledWith("0x00980900", 21);
    press(thumb, "PageDown");
    expect(harness.onCommit).toHaveBeenLastCalledWith("0x00980900", 11);
    press(thumb, "End");
    expect(harness.onCommit).toHaveBeenLastCalledWith("0x00980900", 100);
    press(thumb, "Home");
    expect(harness.onCommit).toHaveBeenLastCalledWith("0x00980900", 0);

    expect(thumb.closest(".touch-none")).not.toBeNull();
  });

  it("commits boolean and action activation exactly once", () => {
    const boolean = descriptor({
      control_type: 2,
      minimum: 0,
      maximum: 1,
      default_value: false,
      current_value: false,
    });
    const harness = renderEditor(boolean);
    click(harness.container.querySelector("[role=switch]") as Element);
    expect(harness.onCommit).toHaveBeenCalledOnce();
    expect(harness.onCommit).toHaveBeenCalledWith("0x00980900", true);

    const button = descriptor({
      control_type: 4,
      minimum: null,
      maximum: null,
      step: null,
      default_value: null,
      current_value: null,
    });
    harness.rerender({ descriptor: button, commitState: idle(null) });
    click(harness.container.querySelector("button") as Element);
    expect(harness.onCommit).toHaveBeenLastCalledWith("0x00980900", null);
    expect(harness.onCommit).toHaveBeenCalledTimes(2);
  });

  it("submits sparse ordinary indexes and integer-menu values", () => {
    const menu = descriptor({
      control_type: 3,
      minimum: 0,
      maximum: 4,
      default_value: 0,
      current_value: 0,
      menu_items: [
        { index: 0, value: null, label: "Auto" },
        { index: 4, value: null, label: "Manual" },
      ],
    });
    const harness = renderEditor(menu);
    const trigger = harness.container.querySelector(
      "[role=combobox]",
    ) as Element;
    click(trigger);
    const manual = Array.from(document.querySelectorAll("[role=option]")).find(
      (option) => option.textContent === "Manual",
    );
    click(manual as Element);
    expect(harness.onCommit).toHaveBeenLastCalledWith("0x00980900", 4);

    const integerMenu = descriptor({
      control_type: 9,
      minimum: 1,
      maximum: 5,
      default_value: 1,
      current_value: 5,
      menu_items: [
        { index: 1, value: 5, label: "50 Hz" },
        { index: 5, value: 60, label: "60 Hz" },
      ],
    });
    harness.rerender({ descriptor: integerMenu, commitState: idle(5) });
    const integerTrigger = harness.container.querySelector(
      "[role=combobox]",
    ) as Element;
    expect(integerTrigger.textContent).toContain("60 Hz");
    click(integerTrigger);
    const fifty = Array.from(document.querySelectorAll("[role=option]")).find(
      (option) => option.textContent === "50 Hz",
    );
    click(fifty as Element);
    expect(harness.onCommit).toHaveBeenLastCalledWith("0x00980900", 5);
    expect(integerTrigger.textContent).toContain("50 Hz");
  });

  it("preserves unknown labeled bits across sequential edits", () => {
    const bitmask = descriptor({
      control_type: 8,
      minimum: 0,
      maximum: 255,
      default_value: 1,
      current_value: 129,
      menu_items: [
        { index: 0, value: 1, label: "First" },
        { index: 2, value: 4, label: "Third" },
      ],
    });
    const { container, onCommit } = renderEditor(bitmask);
    const choices = container.querySelectorAll("[role=checkbox]");

    click(choices[1]);
    expect(onCommit).toHaveBeenLastCalledWith("0x00980900", 133);
    click(choices[0]);
    expect(onCommit).toHaveBeenLastCalledWith("0x00980900", 132);
  });

  it("retains a submitted draft while pending and resets on resolution", () => {
    const base = descriptor({ current_value: 10 });
    const harness = renderEditor(base);
    const input = harness.container.querySelector("input") as HTMLInputElement;
    setInput(input, "20");
    press(input, "Enter");

    harness.rerender({
      commitState: {
        status: "pending",
        authoritativeValue: 10,
        submittedValue: 20,
      },
    });
    const pendingInput = harness.container.querySelector(
      "input",
    ) as HTMLInputElement;
    expect(pendingInput.value).toBe("20");
    expect(pendingInput.disabled).toBe(true);
    expect(
      (
        harness.container.querySelector("[role=slider]") as HTMLElement
      ).getAttribute("data-disabled"),
    ).not.toBeNull();
    press(pendingInput, "Enter");
    expect(harness.onCommit).toHaveBeenCalledTimes(1);

    harness.rerender({
      commitState: {
        status: "success",
        authoritativeValue: 18,
        submittedValue: 20,
      },
    });
    expect(
      (harness.container.querySelector("input") as HTMLInputElement).value,
    ).toBe("18");

    harness.rerender({
      commitState: {
        status: "pending",
        authoritativeValue: 18,
        submittedValue: 22,
      },
    });
    harness.rerender({
      commitState: {
        status: "error",
        authoritativeValue: 18,
        submittedValue: 22,
        code: "write_failed",
        message: "The control could not be changed",
      },
    });
    expect(
      (harness.container.querySelector("input") as HTMLInputElement).value,
    ).toBe("18");
  });

  it("resets stale drafts and validation on policy or confirmed-value change", () => {
    const harness = renderEditor(
      descriptor({ minimum: 0, maximum: 20, step: 2, current_value: 10 }),
    );
    let input = harness.container.querySelector("input") as HTMLInputElement;
    setInput(input, "11");
    press(input, "Enter");
    expect(input.getAttribute("aria-invalid")).toBe("true");

    const changed = descriptor({
      serialized_id: "0x00980901",
      id: 0x00980901,
      minimum: 0,
      maximum: 30,
      step: 3,
      current_value: 12,
      default_value: 30,
    });
    harness.rerender({ descriptor: changed, commitState: idle(12) });
    input = harness.container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("12");
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(harness.onCommit).toHaveBeenCalledTimes(0);
    expect(harness.onValidationChange).toHaveBeenLastCalledWith(
      "0x00980901",
      null,
    );
  });

  it.each([
    [
      "string",
      descriptor({
        control_type: 7,
        minimum: 1,
        maximum: 3,
        default_value: "a",
        current_value: "cam",
        element_size: 4,
      }),
      "four",
      "invalid_string_length" as DescriptorValidationCode,
    ],
    [
      "numeric bitmask",
      descriptor({
        control_type: 8,
        minimum: 0,
        maximum: 255,
        default_value: 1,
        current_value: 5,
      }),
      "0xGG",
      "invalid_bitmask" as DescriptorValidationCode,
    ],
  ])("blocks invalid %s drafts", (_name, fixture, value, code) => {
    const { container, onCommit, onValidationChange } = renderEditor(fixture);
    const input = container.querySelector("input") as HTMLInputElement;
    setInput(input, value);
    press(input, "Enter");
    expect(onCommit).not.toHaveBeenCalled();
    expect(onValidationChange).toHaveBeenLastCalledWith("0x00980900", code);
  });

  it("prevents all interactions for nonwritable controls", () => {
    const nonwritable = descriptor({
      state: {
        backendActive: true,
        backendWritable: false,
        backendReadSupported: true,
        active: true,
        writable: false,
        readSupported: true,
        disabled: false,
        inactive: false,
        readOnly: true,
        grabbed: false,
      },
    });
    const { container, onCommit } = renderEditor(nonwritable);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.disabled).toBe(true);
    press(input, "Enter");
    expect(onCommit).not.toHaveBeenCalled();
  });
});
