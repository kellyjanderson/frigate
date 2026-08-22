import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ImageEntry from "./ImageEntry";
import UploadImageDialog from "../overlay/dialog/UploadImageDialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "imageEntry.initialImageFailure": "The image could not be loaded.",
        "imageEntry.initialImageLoading": "Loading image…",
        "imageEntry.removeInitialImage": "Remove initial image",
        "imageEntry.validation.selectImage": "Please select an image file.",
      })[key] ?? key,
  }),
}));

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

type FetchResponse = {
  ok: boolean;
  url: string;
  headers: Headers;
  blob: () => Promise<Blob>;
};

const roots: Root[] = [];
let objectUrlId = 0;
let createObjectURL: ReturnType<typeof vi.fn>;
let revokeObjectURL: ReturnType<typeof vi.fn>;

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function response(
  blob: Blob,
  overrides: Partial<Omit<FetchResponse, "blob">> = {},
): FetchResponse {
  return {
    ok: true,
    url: `${window.location.origin}/api/faces/crop.jpeg`,
    headers: new Headers(),
    blob: async () => blob,
    ...overrides,
  };
}

function renderEntry(
  props: Partial<React.ComponentProps<typeof ImageEntry>> = {},
) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  const onSave = vi.fn();
  let currentProps = props;
  const rerender = (
    nextProps: Partial<React.ComponentProps<typeof ImageEntry>> = currentProps,
  ) => {
    currentProps = nextProps;
    act(() => {
      root.render(
        <ImageEntry onSave={onSave} {...currentProps}>
          <button type="submit">Save</button>
        </ImageEntry>,
      );
    });
  };
  rerender();
  return { container, onSave, rerender, root };
}

async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function selectFile(container: Element, file: File) {
  const input = container.querySelector("input[type=file]") as HTMLInputElement;
  Object.defineProperty(input, "files", { configurable: true, value: [file] });
  act(() => input.dispatchEvent(new Event("change", { bubbles: true })));
}

beforeEach(() => {
  objectUrlId = 0;
  createObjectURL = vi.fn(() => `blob:preview-${++objectUrlId}`);
  revokeObjectURL = vi.fn();
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
});

afterEach(() => {
  while (roots.length > 0) {
    act(() => roots.pop()?.unmount());
  }
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("ImageEntry initial image hydration", () => {
  it("hydrates one same-origin image and submits only after validation", async () => {
    const request = deferred<FetchResponse>();
    const fetchMock = vi.fn(
      (_url: URL, _init?: RequestInit) => request.promise,
    );
    vi.stubGlobal("fetch", fetchMock);
    const { container, onSave } = renderEntry({
      initialImageLink: "/api/faces/crop.jpeg?token=private#ignored",
    });

    const submit = container.querySelector(
      "button[type=submit]",
    ) as HTMLButtonElement;
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      "Loading image…",
    );
    expect(submit.disabled).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0].href).toBe(
      `${window.location.origin}/api/faces/crop.jpeg?token=private#ignored`,
    );

    request.resolve(
      response(new Blob(["jpeg-bytes"], { type: "image/jpeg" }), {
        url: `${window.location.origin}/api/faces/crop.jpeg?token=private.png#ignored`,
      }),
    );
    await settle();

    expect(container.querySelector('img[src="blob:preview-1"]')).not.toBeNull();
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(submit.disabled).toBe(false);
    act(() => submit.click());
    await settle();

    expect(onSave).toHaveBeenCalledTimes(1);
    const savedFile = onSave.mock.calls[0][0] as File;
    expect(savedFile.name).toBe("crop.jpeg");
    expect(savedFile.type).toBe("image/jpeg");
    expect(savedFile.size).toBe(10);
  });

  it.each([
    ["image/jpeg", "jpeg", ".jpeg"],
    ["image/png", "png", ".png"],
    ["image/gif", "gif", ".gif"],
    ["image/webp", "webp", ".webp"],
  ])(
    "accepts %s and uses a safe fallback filename",
    async (mimeType, subtype, extension) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          response(new Blob([subtype], { type: mimeType }), {
            url: `${window.location.origin}/api/faces/?private=name${extension}`,
          }),
        ),
      );
      const { container, onSave } = renderEntry({
        initialImageLink: `/api/faces/?private=name${extension}`,
      });
      await settle();
      act(() =>
        (
          container.querySelector("button[type=submit]") as HTMLButtonElement
        ).click(),
      );
      await settle();

      const savedFile = onSave.mock.calls[0][0] as File;
      expect(savedFile.name).toBe(`initial-image${extension}`);
      expect(savedFile.type).toBe(mimeType);
      expect(document.body.textContent).not.toContain("private=name");
    },
  );

  it.each([
    ["decoded path separator", "private%2Fcrop.jpeg"],
    ["decoded backslash", "private%5Ccrop.jpeg"],
    ["decoded control character", "private%00crop.jpeg"],
  ])("uses a fallback for a filename with a %s", async (_name, path) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        response(new Blob(["jpeg"], { type: "image/jpeg" }), {
          url: `${window.location.origin}/api/faces/${path}?private.png#ignored`,
        }),
      ),
    );
    const { container, onSave } = renderEntry({
      initialImageLink: `/api/faces/${path}`,
    });
    await settle();
    act(() =>
      (
        container.querySelector("button[type=submit]") as HTMLButtonElement
      ).click(),
    );
    await settle();

    const savedFile = onSave.mock.calls[0][0] as File;
    expect(savedFile.name).toBe("initial-image.jpeg");
    expect(savedFile.name).not.toContain("private.png");
  });

  it.each([
    ["malformed URL", "http://[", false],
    ["network failure", "/crop.jpeg", true],
  ])("shows a generic failure for %s", async (_name, link, shouldFetch) => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("private network detail");
    });
    vi.stubGlobal("fetch", fetchMock);
    const { container } = renderEntry({ initialImageLink: link });
    await settle();

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      "The image could not be loaded.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(shouldFetch ? 1 : 0);
    expect(container.textContent).not.toContain("private network detail");
  });

  it.each([
    ["cross-origin input", "https://example.com/crop.jpeg", null],
    [
      "cross-origin redirect",
      "/crop.jpeg",
      response(new Blob(["jpeg"], { type: "image/jpeg" }), {
        url: "https://example.com/crop.jpeg",
      }),
    ],
    [
      "non-OK response",
      "/crop.jpeg",
      response(new Blob(["jpeg"], { type: "image/jpeg" }), { ok: false }),
    ],
    [
      "empty body",
      "/crop.jpeg",
      response(new Blob([], { type: "image/jpeg" })),
    ],
    [
      "incompatible extension",
      "/crop.png",
      response(new Blob(["jpeg"], { type: "image/jpeg" }), {
        url: `${window.location.origin}/crop.png`,
      }),
    ],
  ])("rejects %s without producing a file", async (_name, link, result) => {
    const fetchMock = vi.fn(async () => result);
    vi.stubGlobal("fetch", fetchMock);
    const { container, onSave } = renderEntry({ initialImageLink: link });
    await settle();

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      "The image could not be loaded.",
    );
    expect(container.querySelector("img")).toBeNull();
    expect(
      (container.querySelector("button[type=submit]") as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
    if (_name === "cross-origin input")
      expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects declared and actual oversize images under a custom cap", async () => {
    const declared = response(new Blob(["ok"], { type: "image/png" }), {
      url: `${window.location.origin}/crop.png`,
      headers: new Headers({ "Content-Length": "5" }),
    });
    const actual = response(new Blob(["large"], { type: "image/png" }), {
      url: `${window.location.origin}/crop.png`,
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(declared)
      .mockResolvedValueOnce(actual);
    vi.stubGlobal("fetch", fetchMock);
    const { container, rerender } = renderEntry({
      initialImageLink: "/declared.png",
      maxSize: 4,
      accept: { "image/png": [".png"] },
    });
    await settle();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();

    rerender({
      initialImageLink: "/actual.png",
      maxSize: 4,
      accept: { "image/png": [".png"] },
    });
    await settle();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("ignores a stale request after a link change", async () => {
    const requestA = deferred<FetchResponse>();
    const requestB = deferred<FetchResponse>();
    const signals: AbortSignal[] = [];
    const fetchMock = vi.fn((_url: URL, init: RequestInit) => {
      signals.push(init.signal as AbortSignal);
      return signals.length === 1 ? requestA.promise : requestB.promise;
    });
    vi.stubGlobal("fetch", fetchMock);
    const { container, rerender } = renderEntry({
      initialImageLink: "/a.jpeg",
    });
    rerender({ initialImageLink: "/b.png" });
    expect(signals[0].aborted).toBe(true);

    requestB.resolve(
      response(new Blob(["png"], { type: "image/png" }), {
        url: `${window.location.origin}/b.png`,
      }),
    );
    await settle();
    requestA.resolve(
      response(new Blob(["jpeg"], { type: "image/jpeg" }), {
        url: `${window.location.origin}/a.jpeg`,
      }),
    );
    await settle();

    expect(container.querySelector('img[src="blob:preview-1"]')).not.toBeNull();
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect((createObjectURL.mock.calls[0][0] as File).name).toBe("b.png");
  });

  it("keeps a local replacement over pending hydration", async () => {
    const request = deferred<FetchResponse>();
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: URL, init: RequestInit) => {
        signal = init.signal as AbortSignal;
        return request.promise;
      }),
    );
    const { container, onSave } = renderEntry({
      initialImageLink: "/pending.jpeg",
    });
    const localFile = new File(["local"], "local.png", { type: "image/png" });
    selectFile(container, localFile);
    await settle();
    expect(signal?.aborted).toBe(true);

    request.resolve(response(new Blob(["remote"], { type: "image/jpeg" })));
    await settle();
    act(() =>
      (
        container.querySelector("button[type=submit]") as HTMLButtonElement
      ).click(),
    );
    await settle();
    expect(onSave).toHaveBeenCalledWith(localFile);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("keeps a local replacement across same-link contract rerenders", async () => {
    const request = deferred<FetchResponse>();
    const fetchMock = vi.fn(() => request.promise);
    vi.stubGlobal("fetch", fetchMock);
    const { container, onSave, rerender } = renderEntry({
      initialImageLink: "/pending.jpeg",
      accept: { "image/*": [".jpeg", ".jpg", ".png"] },
    });
    const localFile = new File(["local"], "local.png", { type: "image/png" });
    selectFile(container, localFile);
    await settle();

    rerender({
      initialImageLink: "/pending.jpeg",
      accept: { "image/*": [".jpeg", ".jpg", ".png"] },
      maxSize: 10 * 1024 * 1024,
    });
    await settle();
    act(() =>
      (
        container.querySelector("button[type=submit]") as HTMLButtonElement
      ).click(),
    );
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(localFile);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "blob:preview-1",
    );
  });

  it("removes a loading image and ignores its eventual completion", async () => {
    const request = deferred<FetchResponse>();
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: URL, init: RequestInit) => {
        signal = init.signal as AbortSignal;
        return request.promise;
      }),
    );
    const { container } = renderEntry({
      initialImageLink: "/pending.jpeg",
    });
    const remove = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Remove initial image",
    );
    act(() => remove?.click());
    expect(signal?.aborted).toBe(true);
    expect(container.querySelector('[role="status"]')).toBeNull();

    request.resolve(response(new Blob(["remote"], { type: "image/jpeg" })));
    await settle();
    expect(container.querySelector("img")).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("removes a hydrated image, suppresses the same link, and cleans URLs", async () => {
    const fetchMock = vi.fn(async () =>
      response(new Blob(["jpeg"], { type: "image/jpeg" })),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { container, rerender, root } = renderEntry({
      initialImageLink: "/crop.jpeg",
    });
    await settle();
    const remove = container.querySelector(
      "button[type=button]",
    ) as HTMLButtonElement;
    act(() => remove.click());
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
    rerender({ initialImageLink: "/crop.jpeg" });
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    rerender({ initialImageLink: "/new.jpeg" });
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    act(() => root.unmount());
    roots.splice(roots.indexOf(root), 1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-2");
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it("preserves the existing no-link picker and explicit submit route", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { container, onSave } = renderEntry();
    const localFile = new File(["jpeg"], "local.jpeg", {
      type: "image/jpeg",
    });
    selectFile(container, localFile);
    await settle();
    act(() =>
      (
        container.querySelector("button[type=submit]") as HTMLButtonElement
      ).click(),
    );
    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledWith(localFile);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "blob:preview-1",
    );
  });

  it("preserves UploadImageDialog as an existing no-link consumer", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);
    const onSave = vi.fn();
    act(() => {
      root.render(
        <UploadImageDialog
          open
          title="Upload image"
          description="Choose an image"
          setOpen={vi.fn()}
          onSave={onSave}
        />,
      );
    });
    const localFile = new File(["jpeg"], "consumer.jpeg", {
      type: "image/jpeg",
    });
    selectFile(document.body, localFile);
    await settle();
    const saveButton = Array.from(
      document.body.querySelectorAll("button[type=submit]"),
    )[0] as HTMLButtonElement;
    act(() => saveButton.click());
    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledWith(localFile);
    expect(
      document.body.querySelector('img[src="blob:preview-1"]'),
    ).not.toBeNull();
  });

  it("uses the same validated file boundary for pasted images", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { container, onSave } = renderEntry();
    const pastedFile = new File(["png"], "pasted.png", {
      type: "image/png",
    });
    const pasteEvent = new Event("paste", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(pasteEvent, "clipboardData", {
      value: {
        items: [{ type: "image/png", getAsFile: () => pastedFile }],
      },
    });
    act(() =>
      container.querySelector('div[tabindex="0"]')?.dispatchEvent(pasteEvent),
    );
    await settle();
    act(() =>
      (
        container.querySelector("button[type=submit]") as HTMLButtonElement
      ).click(),
    );
    await settle();

    expect(onSave).toHaveBeenCalledTimes(1);
    expect((onSave.mock.calls[0][0] as File).name).toBe("pasted.png");
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "blob:preview-1",
    );
  });
});
