"""Safe serialized transactions for configured Linux V4L2 devices."""

from __future__ import annotations

import asyncio
import ctypes
import errno
import fcntl
import hashlib
import os
import re
import struct
from collections import OrderedDict
from collections.abc import Callable, Iterable, Mapping, Sequence
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Any, Literal, TypeVar

from frigate.config.camera import CameraConfig

_VIDIOC_QUERYCAP = 0x80685600
_V4L2_CAPABILITY_SIZE = 104
_VOLATILE_VIDEO_NODE = re.compile(r"^/dev/video\d+$")
_DISCONNECTED_ERRNOS = {
    errno.ENODEV,
    errno.ENOENT,
    errno.ENXIO,
    errno.EIO,
    errno.ESHUTDOWN,
}

V4L2_CTRL_FLAG_DISABLED = 0x0001
V4L2_CTRL_FLAG_GRABBED = 0x0002
V4L2_CTRL_FLAG_READ_ONLY = 0x0004
V4L2_CTRL_FLAG_INACTIVE = 0x0010
V4L2_CTRL_FLAG_WRITE_ONLY = 0x0040
V4L2_CTRL_FLAG_HAS_PAYLOAD = 0x0100
V4L2_CTRL_FLAG_NEXT_CTRL = 0x80000000
V4L2_CTRL_FLAG_NEXT_COMPOUND = 0x40000000

V4L2_CTRL_TYPE_INTEGER = 1
V4L2_CTRL_TYPE_BOOLEAN = 2
V4L2_CTRL_TYPE_MENU = 3
V4L2_CTRL_TYPE_BUTTON = 4
V4L2_CTRL_TYPE_INTEGER64 = 5
V4L2_CTRL_TYPE_CTRL_CLASS = 6
V4L2_CTRL_TYPE_STRING = 7
V4L2_CTRL_TYPE_BITMASK = 8
V4L2_CTRL_TYPE_INTEGER_MENU = 9
V4L2_CTRL_TYPE_U8 = 0x0100
V4L2_CTRL_TYPE_U16 = 0x0101
V4L2_CTRL_TYPE_U32 = 0x0102

_V4L2_CTRL_ID_MASK = 0x0FFF0000
_V4L2_CTRL_MAX_DIMS = 4
_DESCRIPTOR_CACHE_SLOT = "control_descriptors"
_CANONICAL_CONTROL_ID = re.compile(r"^0x[0-9a-f]{8}$")
_SCALAR_CONTROL_TYPES = {
    V4L2_CTRL_TYPE_INTEGER,
    V4L2_CTRL_TYPE_BOOLEAN,
    V4L2_CTRL_TYPE_MENU,
    V4L2_CTRL_TYPE_INTEGER64,
    V4L2_CTRL_TYPE_BITMASK,
    V4L2_CTRL_TYPE_INTEGER_MENU,
}


def _iowr(number: int, structure: type[ctypes.Structure]) -> int:
    """Build a Linux read/write ioctl request for one ctypes structure."""
    return (3 << 30) | (ctypes.sizeof(structure) << 16) | (ord("V") << 8) | number


class _QueryExtControlBuffer(ctypes.Structure):
    _fields_ = [
        ("id", ctypes.c_uint32),
        ("type", ctypes.c_uint32),
        ("name", ctypes.c_ubyte * 32),
        ("minimum", ctypes.c_int64),
        ("maximum", ctypes.c_int64),
        ("step", ctypes.c_uint64),
        ("default_value", ctypes.c_int64),
        ("flags", ctypes.c_uint32),
        ("elem_size", ctypes.c_uint32),
        ("elems", ctypes.c_uint32),
        ("nr_of_dims", ctypes.c_uint32),
        ("dims", ctypes.c_uint32 * _V4L2_CTRL_MAX_DIMS),
        ("reserved", ctypes.c_uint32 * 32),
    ]


class _QueryMenuValue(ctypes.Union):
    _fields_ = [  # noqa: RUF012
        ("name", ctypes.c_ubyte * 32),
        ("value", ctypes.c_int64),
    ]


class _QueryMenuBuffer(ctypes.Structure):
    _pack_ = 1
    _anonymous_ = ("data",)
    _fields_ = [
        ("id", ctypes.c_uint32),
        ("index", ctypes.c_uint32),
        ("data", _QueryMenuValue),
        ("reserved", ctypes.c_uint32),
    ]


class _ExtControlValue(ctypes.Union):
    _fields_ = [  # noqa: RUF012
        ("value", ctypes.c_int32),
        ("value64", ctypes.c_int64),
        ("string", ctypes.c_void_p),
        ("p_u8", ctypes.POINTER(ctypes.c_uint8)),
        ("p_u16", ctypes.POINTER(ctypes.c_uint16)),
        ("p_u32", ctypes.POINTER(ctypes.c_uint32)),
        ("ptr", ctypes.c_void_p),
    ]


class _ExtControlBuffer(ctypes.Structure):
    _pack_ = 1
    _anonymous_ = ("data",)
    _fields_ = [
        ("id", ctypes.c_uint32),
        ("size", ctypes.c_uint32),
        ("reserved2", ctypes.c_uint32 * 1),
        ("data", _ExtControlValue),
    ]


class _ExtControlsBuffer(ctypes.Structure):
    _fields_ = [
        ("which", ctypes.c_uint32),
        ("count", ctypes.c_uint32),
        ("error_idx", ctypes.c_uint32),
        ("request_fd", ctypes.c_int32),
        ("reserved", ctypes.c_uint32 * 1),
        ("controls", ctypes.POINTER(_ExtControlBuffer)),
    ]


_VIDIOC_QUERY_EXT_CTRL = _iowr(103, _QueryExtControlBuffer)
_VIDIOC_QUERYMENU = _iowr(37, _QueryMenuBuffer)
_VIDIOC_G_EXT_CTRLS = _iowr(71, _ExtControlsBuffer)

V4L2ErrorCategory = Literal[
    "not_configured",
    "unstable_device_identity",
    "device_disconnected",
    "device_io",
    "invalid_control_ids",
    "control_not_found",
]
T = TypeVar("T")

V4L2ControlValue = bool | int | str | bytes | tuple[bool | int | str, ...] | None


@dataclass(frozen=True, slots=True)
class V4L2MenuItem:
    """One ordinary or integer V4L2 menu entry."""

    index: int
    value: int | None
    label: str


@dataclass(frozen=True, slots=True)
class V4L2ControlDescriptor:
    """Complete immutable metadata and current state for one V4L2 control."""

    id: int
    serialized_id: str
    name: str
    control_class: int
    control_type: int
    minimum: int
    maximum: int
    step: int
    default_value: int
    current_value: V4L2ControlValue
    menu_items: tuple[V4L2MenuItem, ...]
    flags: int
    element_size: int
    element_count: int
    dimensions: tuple[int, ...]
    active: bool
    writable: bool
    read_supported: bool


@dataclass(frozen=True, slots=True)
class _V4L2QueryControl:
    id: int
    control_type: int
    name: str
    minimum: int
    maximum: int
    step: int
    default_value: int
    flags: int
    element_size: int
    element_count: int
    dimensions: tuple[int, ...]


@dataclass(frozen=True, slots=True)
class _V4L2QueryMenuItem:
    index: int
    value: int | None
    label: str


class _IdentityChangedError(Exception):
    """Indicate that identity changed without exposing its raw components."""


class _TransactionLifetimeError(Exception):
    """Preserve operation and close failures from one device transaction."""

    def __init__(self, operation_error: Exception, close_error: Exception) -> None:
        self.operation_error = operation_error
        self.close_error = close_error
        super().__init__("V4L2 transaction operation and close both failed")


@dataclass(frozen=True, slots=True)
class _ResolvedV4L2Device:
    """A resolved device whose physical key excludes its transient node."""

    configured_reference_digest: str
    device_node: str
    udev_serial: str
    udev_path: str
    bus_info: str
    driver: str
    card: str
    capabilities: int

    @property
    def physical_key(self) -> str:
        """Return the stable physical identity used by the registry."""
        return "\0".join(
            (
                self.udev_serial,
                self.udev_path,
                self.bus_info,
                self.driver,
                self.card,
            )
        )

    @property
    def physical_identity_digest(self) -> str:
        """Return a caller-safe digest for ordering and diagnostics."""
        return hashlib.sha256(self.physical_key.encode()).hexdigest()


class V4L2Adapter:
    """Blocking Linux V4L2 access seam used by the transaction executor."""

    def resolve_device(
        self, configured_reference: str, configured_reference_digest: str
    ) -> _ResolvedV4L2Device:
        """Resolve and probe one configured stable device reference."""
        device_node = os.path.realpath(configured_reference)
        os.stat(device_node)
        properties = self._udev_properties(device_node)
        fd = self.open_device(device_node)
        try:
            capabilities = self.query_capabilities(fd)
        finally:
            self.close_device(fd)
        return self._resolved_device(
            configured_reference_digest,
            device_node,
            properties,
            capabilities,
        )

    def open_device(self, device_node: str) -> int:
        """Open a V4L2 device for downstream read and write ioctls."""
        return os.open(device_node, os.O_RDWR | os.O_NONBLOCK)

    def validate_open_device(
        self,
        fd: int,
        configured_reference: str,
        configured_reference_digest: str,
    ) -> _ResolvedV4L2Device:
        """Re-resolve and validate identity for an already opened descriptor."""
        device_node = os.path.realpath(configured_reference)
        if os.stat(device_node).st_rdev != os.fstat(fd).st_rdev:
            raise _IdentityChangedError
        properties = self._udev_properties(device_node)
        capabilities = self.query_capabilities(fd)
        return self._resolved_device(
            configured_reference_digest,
            device_node,
            properties,
            capabilities,
        )

    def query_capabilities(self, fd: int) -> tuple[str, str, str, int]:
        """Return driver, card, bus, and capability data from QUERYCAP."""
        buffer = bytearray(_V4L2_CAPABILITY_SIZE)
        fcntl.ioctl(fd, _VIDIOC_QUERYCAP, buffer, True)
        driver, card, bus_info, _version, capabilities, device_caps = struct.unpack(
            "16s32s32sIII", buffer[:92]
        )
        effective_capabilities = (
            device_caps if capabilities & 0x80000000 else capabilities
        )
        return (
            self._decode_c_string(driver),
            self._decode_c_string(card),
            self._decode_c_string(bus_info),
            effective_capabilities,
        )

    def ioctl(
        self,
        fd: int,
        request: int,
        argument: Any = 0,
        mutate_flag: bool = True,
    ) -> Any:
        """Issue a downstream ioctl against the validated open descriptor."""
        return fcntl.ioctl(fd, request, argument, mutate_flag)

    def query_control(self, fd: int, control_id: int) -> _V4L2QueryControl:
        """Return the next extended-control descriptor from the driver."""
        query = _QueryExtControlBuffer(id=control_id)
        self.ioctl(fd, _VIDIOC_QUERY_EXT_CTRL, query)
        dimensions = tuple(query.dims[: query.nr_of_dims])
        return _V4L2QueryControl(
            id=query.id,
            control_type=query.type,
            name=self._decode_c_string(bytes(query.name)),
            minimum=query.minimum,
            maximum=query.maximum,
            step=query.step,
            default_value=query.default_value,
            flags=query.flags,
            element_size=query.elem_size,
            element_count=query.elems,
            dimensions=dimensions,
        )

    def query_menu(
        self,
        fd: int,
        control_id: int,
        index: int,
        *,
        integer_menu: bool,
    ) -> _V4L2QueryMenuItem:
        """Return one ordinary or integer menu item."""
        query = _QueryMenuBuffer(id=control_id, index=index)
        self.ioctl(fd, _VIDIOC_QUERYMENU, query)
        return _V4L2QueryMenuItem(
            index=index,
            value=query.value if integer_menu else None,
            label=(
                str(query.value)
                if integer_menu
                else self._decode_c_string(bytes(query.name))
            ),
        )

    def get_control_values(
        self,
        fd: int,
        controls: Sequence[V4L2ControlDescriptor],
        *,
        control_class: int = 0,
    ) -> Mapping[int, V4L2ControlValue]:
        """Read a compatible group of current control values."""
        if not controls:
            return {}

        control_buffers = (_ExtControlBuffer * len(controls))()
        allocations: list[ctypes.Array[Any]] = []
        for index, descriptor in enumerate(controls):
            control = control_buffers[index]
            control.id = descriptor.id
            allocation = self._prepare_read_buffer(control, descriptor)
            if allocation is not None:
                allocations.append(allocation)

        request = _ExtControlsBuffer(
            which=control_class,
            count=len(controls),
            request_fd=0,
            controls=control_buffers,
        )
        self.ioctl(fd, _VIDIOC_G_EXT_CTRLS, request)
        return {
            descriptor.id: self._decode_control_value(
                control_buffers[index], descriptor
            )
            for index, descriptor in enumerate(controls)
        }

    @staticmethod
    def _prepare_read_buffer(
        control: _ExtControlBuffer,
        descriptor: V4L2ControlDescriptor,
    ) -> ctypes.Array[Any] | None:
        allocation: ctypes.Array[Any]
        if descriptor.control_type == V4L2_CTRL_TYPE_STRING:
            size = max(
                descriptor.maximum + 1,
                descriptor.element_size * descriptor.element_count,
                1,
            )
            allocation = (ctypes.c_char * size)()
        elif descriptor.control_type == V4L2_CTRL_TYPE_U16:
            allocation = (ctypes.c_uint16 * descriptor.element_count)()
        elif descriptor.control_type == V4L2_CTRL_TYPE_U32:
            allocation = (ctypes.c_uint32 * descriptor.element_count)()
        elif descriptor.flags & V4L2_CTRL_FLAG_HAS_PAYLOAD or descriptor.dimensions:
            size = descriptor.element_size * descriptor.element_count
            allocation = (ctypes.c_uint8 * size)()
        else:
            return None

        control.size = ctypes.sizeof(allocation)
        control.ptr = ctypes.cast(allocation, ctypes.c_void_p)
        return allocation

    @staticmethod
    def _decode_control_value(
        control: _ExtControlBuffer,
        descriptor: V4L2ControlDescriptor,
    ) -> V4L2ControlValue:
        if descriptor.flags & V4L2_CTRL_FLAG_HAS_PAYLOAD or descriptor.dimensions:
            if descriptor.control_type == V4L2_CTRL_TYPE_BOOLEAN:
                values = ctypes.cast(control.ptr, ctypes.POINTER(ctypes.c_int32))
                return tuple(
                    bool(value) for value in values[: descriptor.element_count]
                )
            if descriptor.control_type in {
                V4L2_CTRL_TYPE_INTEGER,
                V4L2_CTRL_TYPE_MENU,
                V4L2_CTRL_TYPE_BITMASK,
                V4L2_CTRL_TYPE_INTEGER_MENU,
            }:
                values = ctypes.cast(control.ptr, ctypes.POINTER(ctypes.c_int32))
                return tuple(values[: descriptor.element_count])
            if descriptor.control_type == V4L2_CTRL_TYPE_INTEGER64:
                int64_values = ctypes.cast(control.ptr, ctypes.POINTER(ctypes.c_int64))
                return tuple(int64_values[: descriptor.element_count])
        if descriptor.control_type == V4L2_CTRL_TYPE_BOOLEAN:
            return bool(control.value)
        if descriptor.control_type == V4L2_CTRL_TYPE_INTEGER64:
            return int(control.value64)
        if descriptor.control_type in _SCALAR_CONTROL_TYPES:
            return int(control.value)
        if descriptor.control_type == V4L2_CTRL_TYPE_STRING:
            value = ctypes.string_at(control.ptr, control.size).split(b"\0", 1)[0]
            try:
                return value.decode("utf-8")
            except UnicodeDecodeError:
                return None
        if descriptor.control_type == V4L2_CTRL_TYPE_U8:
            return ctypes.string_at(control.ptr, control.size)
        if descriptor.control_type == V4L2_CTRL_TYPE_U16:
            return tuple(control.p_u16[: descriptor.element_count])
        if descriptor.control_type == V4L2_CTRL_TYPE_U32:
            return tuple(control.p_u32[: descriptor.element_count])
        if control.ptr and control.size:
            return ctypes.string_at(control.ptr, control.size)
        return None

    def close_device(self, fd: int) -> None:
        """Close a transaction-owned descriptor."""
        os.close(fd)

    @staticmethod
    def _decode_c_string(value: bytes) -> str:
        return value.split(b"\0", 1)[0].decode("utf-8")

    @classmethod
    def _udev_properties(cls, device_node: str) -> dict[str, str]:
        stat_result = os.stat(device_node)
        database_path = Path(
            f"/run/udev/data/c{os.major(stat_result.st_rdev)}:"
            f"{os.minor(stat_result.st_rdev)}"
        )
        try:
            lines = database_path.read_text().splitlines()
        except FileNotFoundError:
            return cls._sysfs_identity(stat_result.st_rdev)

        properties = {
            key: value
            for line in lines
            if line.startswith("E:") and "=" in line
            for key, value in [line[2:].split("=", 1)]
        }
        if properties.get("ID_SERIAL") and properties.get("ID_PATH"):
            return properties
        return cls._sysfs_identity(stat_result.st_rdev)

    @staticmethod
    def _sysfs_identity(device_number: int) -> dict[str, str]:
        device_path = Path(
            f"/sys/dev/char/{os.major(device_number)}:{os.minor(device_number)}/device"
        ).resolve(strict=True)
        for parent in (device_path, *device_path.parents):
            if parent == Path("/sys"):
                break
            serial_path = parent / "serial"
            try:
                serial = serial_path.read_text().strip()
            except (FileNotFoundError, NotADirectoryError, PermissionError):
                continue
            if serial:
                physical_path = os.path.relpath(parent, "/sys/devices")
                return {
                    "ID_SERIAL": serial,
                    "ID_PATH": f"sysfs:{physical_path}",
                }
        raise _IdentityChangedError

    @staticmethod
    def _resolved_device(
        configured_reference_digest: str,
        device_node: str,
        properties: dict[str, str],
        capabilities: tuple[str, str, str, int],
    ) -> _ResolvedV4L2Device:
        udev_serial = properties.get("ID_SERIAL", "")
        udev_path = properties.get("ID_PATH", "")
        if not udev_serial or not udev_path:
            raise _IdentityChangedError
        driver, card, bus_info, capability_bits = capabilities
        if not driver or not card or not bus_info:
            raise _IdentityChangedError
        return _ResolvedV4L2Device(
            configured_reference_digest=configured_reference_digest,
            device_node=device_node,
            udev_serial=udev_serial,
            udev_path=udev_path,
            bus_info=bus_info,
            driver=driver,
            card=card,
            capabilities=capability_bits,
        )


class V4L2ControlError(Exception):
    """A stable categorized V4L2 failure safe for callers and normal logs."""

    def __init__(
        self,
        category: V4L2ErrorCategory,
        camera_name: str,
        operation: str,
        *,
        identity_digest: str | None = None,
        private_cause: Exception | None = None,
    ) -> None:
        self.category = category
        self.camera_name = camera_name
        self.operation = operation
        self.identity_digest = identity_digest
        self.private_cause = private_cause
        super().__init__(
            f"V4L2 {operation} failed for camera {camera_name}: {category}"
        )


@dataclass(slots=True)
class _V4L2DeviceState:
    """Serialized state and payload-agnostic cache for one physical device."""

    physical_key: str
    identity_digest: str
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    generation: int = 0
    cache_slots: dict[str, object] = field(default_factory=dict)
    leases: int = 0
    stale: bool = False
    requires_revalidation: bool = True

    def invalidate(self) -> None:
        """Invalidate all derived state after uncertain device work."""
        self.generation += 1
        self.cache_slots.clear()
        self.requires_revalidation = True


@dataclass(slots=True)
class _IdentityBinding:
    physical_key: str
    version: int
    rejected_candidate_digest: str | None = None


@dataclass(frozen=True, slots=True)
class _RegistryLease:
    reference_digest: str
    candidate_key: str
    binding_version: int
    prior_key: str | None
    states: tuple[_V4L2DeviceState, ...]


class _V4L2IdentityRegistry:
    """Own configured-reference bindings and lease-safe physical states."""

    def __init__(self) -> None:
        self._mutex = asyncio.Lock()
        self._bindings: dict[str, _IdentityBinding] = {}
        self._states: dict[str, _V4L2DeviceState] = {}

    async def lease(
        self, reference_digest: str, candidate: _ResolvedV4L2Device
    ) -> _RegistryLease:
        """Lease all states needed for one binding decision."""
        async with self._mutex:
            binding = self._bindings.get(reference_digest)
            prior_key = binding.physical_key if binding else None
            keys = {candidate.physical_key}
            if prior_key is not None:
                keys.add(prior_key)
            states = tuple(
                sorted(
                    (self._state_for(key) for key in keys),
                    key=lambda state: state.identity_digest,
                )
            )
            for state in states:
                state.leases += 1
            return _RegistryLease(
                reference_digest=reference_digest,
                candidate_key=candidate.physical_key,
                binding_version=binding.version if binding else 0,
                prior_key=prior_key,
                states=states,
            )

    async def lease_bound(self, reference_digest: str) -> _RegistryLease | None:
        """Lease the authoritative state currently bound to a reference."""
        async with self._mutex:
            binding = self._bindings.get(reference_digest)
            if binding is None:
                return None
            state = self._states[binding.physical_key]
            state.leases += 1
            return _RegistryLease(
                reference_digest=reference_digest,
                candidate_key=binding.physical_key,
                binding_version=binding.version,
                prior_key=binding.physical_key,
                states=(state,),
            )

    async def snapshot_is_current(self, lease: _RegistryLease) -> bool:
        """Confirm the binding did not change while device locks were acquired."""
        async with self._mutex:
            binding = self._bindings.get(lease.reference_digest)
            return (binding.version if binding else 0) == lease.binding_version and (
                binding.physical_key if binding else None
            ) == lease.prior_key

    async def accept_or_reject(
        self, lease: _RegistryLease, candidate: _ResolvedV4L2Device
    ) -> bool | None:
        """Bind, reject, or require a retry when the snapshot changed."""
        async with self._mutex:
            binding = self._bindings.get(lease.reference_digest)
            if (binding.version if binding else 0) != lease.binding_version or (
                binding.physical_key if binding else None
            ) != lease.prior_key:
                return None
            if binding is None:
                self._bindings[lease.reference_digest] = _IdentityBinding(
                    physical_key=candidate.physical_key,
                    version=1,
                )
                self._states[candidate.physical_key].stale = False
                return True
            if binding.physical_key == candidate.physical_key:
                return True

            prior_state = self._states[binding.physical_key]
            prior_state.invalidate()
            binding.version += 1
            binding.rejected_candidate_digest = candidate.physical_identity_digest
            candidate_state = self._states[candidate.physical_key]
            if not self._is_bound(candidate.physical_key):
                candidate_state.cache_slots.clear()
                candidate_state.stale = True
                candidate_state.requires_revalidation = True
            return False

    async def release(self, lease: _RegistryLease) -> None:
        """Release state leases and retire only safe unbound stale entries."""
        async with self._mutex:
            for state in lease.states:
                state.leases -= 1
            for state in lease.states:
                if (
                    state.stale
                    and state.leases == 0
                    and not state.cache_slots
                    and not self._is_bound(state.physical_key)
                ):
                    self._states.pop(state.physical_key, None)

    def _state_for(self, physical_key: str) -> _V4L2DeviceState:
        state = self._states.get(physical_key)
        if state is None:
            identity_digest = hashlib.sha256(physical_key.encode()).hexdigest()
            state = _V4L2DeviceState(physical_key, identity_digest)
            self._states[physical_key] = state
        return state

    def _is_bound(self, physical_key: str) -> bool:
        return any(
            binding.physical_key == physical_key for binding in self._bindings.values()
        )


V4L2Operation = Callable[[V4L2Adapter, int, _ResolvedV4L2Device, _V4L2DeviceState], T]


class V4L2DeviceTransactionExecutor:
    """Run complete blocking device transactions under physical-device locks."""

    def __init__(self, adapter: V4L2Adapter | None = None) -> None:
        self._adapter = adapter or V4L2Adapter()
        self._registry = _V4L2IdentityRegistry()

    async def run(
        self,
        camera_config: CameraConfig,
        operation: V4L2Operation[T],
        *,
        operation_name: str = "device_transaction",
    ) -> T:
        """Resolve, serialize, execute, and close one V4L2 transaction."""
        camera_name = camera_config.name or "unnamed"
        configured_reference = camera_config.v4l2_device
        if configured_reference is None:
            raise V4L2ControlError("not_configured", camera_name, operation_name)
        if not self._is_stable_reference(configured_reference):
            raise V4L2ControlError(
                "unstable_device_identity", camera_name, operation_name
            )

        reference_digest = hashlib.sha256(configured_reference.encode()).hexdigest()
        candidate = await self._resolve_candidate(
            configured_reference,
            reference_digest,
            camera_name,
            operation_name,
        )

        while True:
            lease = await self._registry.lease(reference_digest, candidate)
            acquired: list[_V4L2DeviceState] = []
            try:
                for state in lease.states:
                    await state.lock.acquire()
                    acquired.append(state)
                if not await self._registry.snapshot_is_current(lease):
                    continue
                decision = await self._registry.accept_or_reject(lease, candidate)
                if decision is None:
                    continue
                if not decision:
                    raise V4L2ControlError(
                        "unstable_device_identity",
                        camera_name,
                        operation_name,
                        identity_digest=candidate.physical_identity_digest,
                    )

                candidate_state = next(
                    state
                    for state in lease.states
                    if state.physical_key == candidate.physical_key
                )
                worker = asyncio.create_task(
                    asyncio.to_thread(
                        self._blocking_transaction,
                        configured_reference,
                        reference_digest,
                        candidate,
                        candidate_state,
                        operation,
                    )
                )
                try:
                    result = await asyncio.shield(worker)
                except asyncio.CancelledError as cancellation:
                    while not worker.done():
                        try:
                            await asyncio.shield(worker)
                        except asyncio.CancelledError:
                            continue
                        except BaseException:
                            break
                    candidate_state.invalidate()
                    raise cancellation
                except Exception as error:
                    candidate_state.invalidate()
                    raise self._safe_error(
                        error,
                        camera_name,
                        operation_name,
                        candidate.physical_identity_digest,
                    ) from None

                candidate_state.requires_revalidation = False
                return result
            except V4L2ControlError:
                raise
            finally:
                for state in reversed(acquired):
                    state.lock.release()
                await self._registry.release(lease)

    async def _resolve_candidate(
        self,
        configured_reference: str,
        reference_digest: str,
        camera_name: str,
        operation_name: str,
    ) -> _ResolvedV4L2Device:
        try:
            candidate = await asyncio.to_thread(
                self._adapter.resolve_device,
                configured_reference,
                reference_digest,
            )
        except Exception as error:
            safe_error = self._safe_error(error, camera_name, operation_name)
            if safe_error.category == "device_disconnected":
                await self._invalidate_bound_reference(reference_digest)
            raise safe_error from None
        if candidate.configured_reference_digest != reference_digest:
            raise V4L2ControlError(
                "unstable_device_identity", camera_name, operation_name
            )
        return candidate

    async def _invalidate_bound_reference(self, reference_digest: str) -> None:
        """Invalidate a bound device state after resolution-time removal."""
        while True:
            lease = await self._registry.lease_bound(reference_digest)
            if lease is None:
                return
            state = lease.states[0]
            acquired = False
            try:
                await state.lock.acquire()
                acquired = True
                if not await self._registry.snapshot_is_current(lease):
                    continue
                state.invalidate()
                return
            finally:
                if acquired:
                    state.lock.release()
                await self._registry.release(lease)

    def _blocking_transaction(
        self,
        configured_reference: str,
        reference_digest: str,
        candidate: _ResolvedV4L2Device,
        state: _V4L2DeviceState,
        operation: V4L2Operation[T],
    ) -> T:
        fd = self._adapter.open_device(candidate.device_node)
        operation_error: Exception | None = None
        try:
            validated = self._adapter.validate_open_device(
                fd,
                configured_reference,
                reference_digest,
            )
            if (
                validated.configured_reference_digest != reference_digest
                or validated.physical_key != candidate.physical_key
            ):
                raise _IdentityChangedError
            return operation(self._adapter, fd, validated, state)
        except Exception as error:
            operation_error = error
            raise
        finally:
            try:
                self._adapter.close_device(fd)
            except Exception as close_error:
                if operation_error is None:
                    raise
                raise _TransactionLifetimeError(
                    operation_error,
                    close_error,
                ) from operation_error

    @staticmethod
    def _is_stable_reference(configured_reference: str) -> bool:
        return os.path.isabs(
            configured_reference
        ) and not _VOLATILE_VIDEO_NODE.fullmatch(configured_reference)

    @staticmethod
    def _safe_error(
        error: Exception,
        camera_name: str,
        operation_name: str,
        identity_digest: str | None = None,
    ) -> V4L2ControlError:
        if isinstance(error, V4L2ControlError):
            return error
        if isinstance(error, _TransactionLifetimeError):
            transaction_errors = (error.operation_error, error.close_error)
            if any(
                isinstance(transaction_error, OSError)
                and transaction_error.errno in _DISCONNECTED_ERRNOS
                for transaction_error in transaction_errors
            ):
                category: V4L2ErrorCategory = "device_disconnected"
            else:
                category = "device_io"
        elif isinstance(error, _IdentityChangedError):
            category: V4L2ErrorCategory = "unstable_device_identity"
        elif isinstance(error, OSError) and error.errno in _DISCONNECTED_ERRNOS:
            category = "device_disconnected"
        else:
            category = "device_io"
        return V4L2ControlError(
            category,
            camera_name,
            operation_name,
            identity_digest=identity_digest,
            private_cause=error,
        )


class V4L2ControlProvider:
    """Discover V4L2 controls and return authoritative live values."""

    def __init__(
        self,
        executor: V4L2DeviceTransactionExecutor | None = None,
    ) -> None:
        self._executor = executor or V4L2DeviceTransactionExecutor()

    async def get_controls(
        self,
        camera_config: CameraConfig,
        *,
        refresh: bool = False,
    ) -> tuple[V4L2ControlDescriptor, ...]:
        """Return complete ordered descriptors with freshly read values."""

        def discover_and_read(
            adapter: V4L2Adapter,
            fd: int,
            _resolved: _ResolvedV4L2Device,
            state: _V4L2DeviceState,
        ) -> tuple[V4L2ControlDescriptor, ...]:
            if refresh:
                state.cache_slots.pop(_DESCRIPTOR_CACHE_SLOT, None)
            descriptors = self._descriptors(adapter, fd, state)
            values: dict[int, V4L2ControlValue] = {}
            groups: OrderedDict[int, list[V4L2ControlDescriptor]] = OrderedDict()
            for descriptor in descriptors:
                if descriptor.read_supported:
                    groups.setdefault(descriptor.control_class, []).append(descriptor)
            for control_class, group in groups.items():
                values.update(
                    adapter.get_control_values(
                        fd,
                        group,
                        control_class=control_class,
                    )
                )
            return tuple(
                self._descriptor_with_current_value(
                    descriptor,
                    values.get(descriptor.id),
                )
                for descriptor in descriptors
            )

        return await self._executor.run(
            camera_config,
            discover_and_read,
            operation_name="get_controls",
        )

    async def get_control_values(
        self,
        camera_config: CameraConfig,
        serialized_ids: Iterable[str],
    ) -> Mapping[str, bool | int | str | None]:
        """Return one bounded ordered selection of scalar live values."""
        ids = self._validated_control_ids(camera_config, serialized_ids)

        def read_selected(
            adapter: V4L2Adapter,
            fd: int,
            _resolved: _ResolvedV4L2Device,
            state: _V4L2DeviceState,
        ) -> Mapping[str, bool | int | str | None]:
            descriptors = self._descriptors(adapter, fd, state)
            descriptors_by_id = {
                descriptor.serialized_id: descriptor for descriptor in descriptors
            }
            try:
                selected = tuple(
                    descriptors_by_id[serialized_id] for serialized_id in ids
                )
            except KeyError as error:
                raise V4L2ControlError(
                    "control_not_found",
                    camera_config.name or "unnamed",
                    "get_control_values",
                ) from error

            readable = tuple(
                descriptor
                for descriptor in selected
                if self._supports_scalar_read(descriptor)
            )
            values = adapter.get_control_values(fd, readable) if readable else {}
            return OrderedDict(
                (
                    descriptor.serialized_id,
                    self._scalar_value(values.get(descriptor.id)),
                )
                for descriptor in selected
            )

        return await self._executor.run(
            camera_config,
            read_selected,
            operation_name="get_control_values",
        )

    @staticmethod
    def _validated_control_ids(
        camera_config: CameraConfig,
        serialized_ids: Iterable[str],
    ) -> tuple[str, ...]:
        try:
            ids = tuple(serialized_ids)
        except TypeError as error:
            raise V4L2ControlError(
                "invalid_control_ids",
                camera_config.name or "unnamed",
                "get_control_values",
            ) from error
        malformed = any(
            not isinstance(serialized_id, str)
            or _CANONICAL_CONTROL_ID.fullmatch(serialized_id) is None
            for serialized_id in ids
        )
        if not 1 <= len(ids) <= 64 or malformed or len(set(ids)) != len(ids):
            raise V4L2ControlError(
                "invalid_control_ids",
                camera_config.name or "unnamed",
                "get_control_values",
            )
        return ids

    def _descriptors(
        self,
        adapter: V4L2Adapter,
        fd: int,
        state: _V4L2DeviceState,
    ) -> tuple[V4L2ControlDescriptor, ...]:
        cached = state.cache_slots.get(_DESCRIPTOR_CACHE_SLOT)
        if isinstance(cached, tuple) and all(
            isinstance(item, V4L2ControlDescriptor) for item in cached
        ):
            return cached
        descriptors = self._enumerate_descriptors(adapter, fd)
        state.cache_slots[_DESCRIPTOR_CACHE_SLOT] = descriptors
        return descriptors

    def _enumerate_descriptors(
        self,
        adapter: V4L2Adapter,
        fd: int,
    ) -> tuple[V4L2ControlDescriptor, ...]:
        descriptors: list[V4L2ControlDescriptor] = []
        query_id = V4L2_CTRL_FLAG_NEXT_CTRL | V4L2_CTRL_FLAG_NEXT_COMPOUND
        while True:
            try:
                query = adapter.query_control(fd, query_id)
            except OSError as error:
                if error.errno == errno.EINVAL:
                    break
                raise
            menu_items = self._menu_items(adapter, fd, query)
            descriptors.append(self._descriptor(query, menu_items))
            query_id = (
                query.id | V4L2_CTRL_FLAG_NEXT_CTRL | V4L2_CTRL_FLAG_NEXT_COMPOUND
            )
        return tuple(descriptors)

    @staticmethod
    def _menu_items(
        adapter: V4L2Adapter,
        fd: int,
        query: _V4L2QueryControl,
    ) -> tuple[V4L2MenuItem, ...]:
        if query.control_type not in (
            V4L2_CTRL_TYPE_MENU,
            V4L2_CTRL_TYPE_INTEGER_MENU,
        ):
            return ()
        items: list[V4L2MenuItem] = []
        for index in range(query.minimum, query.maximum + 1):
            try:
                item = adapter.query_menu(
                    fd,
                    query.id,
                    index,
                    integer_menu=query.control_type == V4L2_CTRL_TYPE_INTEGER_MENU,
                )
            except OSError as error:
                if error.errno == errno.EINVAL:
                    continue
                raise
            items.append(V4L2MenuItem(item.index, item.value, item.label))
        return tuple(items)

    @staticmethod
    def _descriptor(
        query: _V4L2QueryControl,
        menu_items: tuple[V4L2MenuItem, ...],
    ) -> V4L2ControlDescriptor:
        active = not query.flags & (V4L2_CTRL_FLAG_DISABLED | V4L2_CTRL_FLAG_INACTIVE)
        writable = active and not query.flags & (
            V4L2_CTRL_FLAG_READ_ONLY | V4L2_CTRL_FLAG_GRABBED
        )
        return V4L2ControlDescriptor(
            id=query.id,
            serialized_id=f"0x{query.id:08x}",
            name=query.name,
            control_class=query.id & _V4L2_CTRL_ID_MASK,
            control_type=query.control_type,
            minimum=query.minimum,
            maximum=query.maximum,
            step=query.step,
            default_value=query.default_value,
            current_value=None,
            menu_items=menu_items,
            flags=query.flags,
            element_size=query.element_size,
            element_count=query.element_count,
            dimensions=query.dimensions,
            active=active,
            writable=writable,
            read_supported=V4L2ControlProvider._supports_lossless_read(query),
        )

    @staticmethod
    def _supports_lossless_read(query: _V4L2QueryControl) -> bool:
        if query.flags & V4L2_CTRL_FLAG_WRITE_ONLY:
            return False
        if query.control_type in (V4L2_CTRL_TYPE_BUTTON, V4L2_CTRL_TYPE_CTRL_CLASS):
            return False
        if query.control_type in _SCALAR_CONTROL_TYPES:
            if not query.dimensions and not (query.flags & V4L2_CTRL_FLAG_HAS_PAYLOAD):
                return True
            expected_size = 8 if query.control_type == V4L2_CTRL_TYPE_INTEGER64 else 4
            return query.element_size == expected_size and query.element_count > 0
        if query.control_type == V4L2_CTRL_TYPE_STRING:
            return True
        if query.control_type in (
            V4L2_CTRL_TYPE_U8,
            V4L2_CTRL_TYPE_U16,
            V4L2_CTRL_TYPE_U32,
        ):
            return query.element_count > 0
        return bool(
            query.flags & V4L2_CTRL_FLAG_HAS_PAYLOAD
            and query.element_size > 0
            and query.element_count > 0
        )

    @staticmethod
    def _supports_scalar_read(descriptor: V4L2ControlDescriptor) -> bool:
        return (
            descriptor.read_supported
            and not descriptor.dimensions
            and (
                descriptor.control_type == V4L2_CTRL_TYPE_STRING
                or (
                    not descriptor.flags & V4L2_CTRL_FLAG_HAS_PAYLOAD
                    and descriptor.control_type in _SCALAR_CONTROL_TYPES
                )
            )
        )

    @staticmethod
    def _descriptor_with_current_value(
        descriptor: V4L2ControlDescriptor,
        value: V4L2ControlValue,
    ) -> V4L2ControlDescriptor:
        return replace(
            descriptor,
            current_value=value,
            read_supported=descriptor.read_supported and value is not None,
        )

    @staticmethod
    def _scalar_value(value: V4L2ControlValue) -> bool | int | str | None:
        return value if isinstance(value, bool | int | str) else None
