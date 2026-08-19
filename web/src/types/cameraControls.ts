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
