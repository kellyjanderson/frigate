export type CameraControlValue = boolean | number | string | null;

export type CameraControlMenuItem = {
  index: number;
  value: number | null;
  label: string;
};

export type DescriptorControlState = {
  backendActive: boolean;
  backendWritable: boolean;
  backendReadSupported: boolean;
  active: boolean;
  writable: boolean;
  readSupported: boolean;
  disabled: boolean;
  inactive: boolean;
  readOnly: boolean;
  grabbed: boolean;
};

export type CameraControlDescriptor = {
  id: number;
  serialized_id: string;
  name: string;
  control_class: number;
  control_type: number;
  minimum: number | null;
  maximum: number | null;
  step: number | null;
  default_value: CameraControlValue;
  current_value: CameraControlValue;
  menu_items: CameraControlMenuItem[];
  flags: number;
  element_size: number;
  element_count: number;
  dimensions: number[];
  active: boolean;
  writable: boolean;
  read_supported: boolean;
  structurally_supported: true;
  state: DescriptorControlState;
};

export type DescriptorNormalizationReason =
  | "malformed_descriptor"
  | "invalid_serialized_id"
  | "unsafe_integer"
  | "invalid_scalar_value"
  | "invalid_menu_items"
  | "unsupported_control_type"
  | "unsupported_element_shape"
  | "payload_not_supported";

export type DescriptorSafeMetadata = {
  id?: number;
  serialized_id?: string;
  name?: string;
  control_class?: number;
  control_type?: number;
  state?: DescriptorControlState;
};

export type DescriptorNormalizationResult =
  | { ok: true; descriptor: CameraControlDescriptor }
  | {
      ok: false;
      reason: DescriptorNormalizationReason;
      safeMetadata: DescriptorSafeMetadata;
    };

export type DescriptorEditorKind =
  | "boolean"
  | "integer"
  | "menu"
  | "integer-menu"
  | "button"
  | "string"
  | "labeled-bitmask"
  | "numeric-bitmask"
  | "unsupported";

export type DescriptorValidationCode =
  | "control_not_editable"
  | "unsupported_type"
  | "invalid_type"
  | "non_finite_integer"
  | "unsafe_integer"
  | "out_of_range"
  | "step_mismatch"
  | "menu_value_not_found"
  | "invalid_string_length"
  | "invalid_bitmask";

export type DescriptorValidationResult =
  | { ok: true; value: CameraControlValue }
  | { ok: false; code: DescriptorValidationCode };

export type DescriptorCommitCallback = (
  controlId: string,
  value: CameraControlValue,
) => void;

export type DescriptorCommitState =
  | {
      status: "idle";
      authoritativeValue: CameraControlValue;
    }
  | {
      status: "pending";
      authoritativeValue: CameraControlValue;
      submittedValue: CameraControlValue;
    }
  | {
      status: "success";
      authoritativeValue: CameraControlValue;
      submittedValue: CameraControlValue;
    }
  | {
      status: "error";
      authoritativeValue: CameraControlValue;
      submittedValue: CameraControlValue;
      code: string;
      message: string;
    };
