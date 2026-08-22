import { afterEach, describe, expect, it, vi } from "vitest";

import { ClassificationItemData } from "@/types/classification";
import { identifySavedFaceAttempt } from "./faceLibraryIdentify";

function attempt(filepath: string): ClassificationItemData {
  return {
    eventId: "event-id",
    filename: "saved-attempt.webp",
    filepath,
    name: "unknown",
    score: 0.95,
    timestamp: 1775487131.3863528,
  };
}

function actions() {
  return {
    clearInitialImageLink: vi.fn(),
    forwardInitialImageLink: vi.fn(),
    openAddFace: vi.fn(),
    rememberFocusTarget: vi.fn(),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("saved face attempt Identify admission", () => {
  it("forwards the exact same-origin crop and opens Add Face", () => {
    const routeActions = actions();

    identifySavedFaceAttempt(
      attempt("clips/faces/train/saved-attempt.webp"),
      routeActions,
    );

    expect(routeActions.forwardInitialImageLink).toHaveBeenCalledWith(
      `${window.location.origin}/clips/faces/train/saved-attempt.webp`,
    );
    expect(routeActions.clearInitialImageLink).not.toHaveBeenCalled();
    expect(routeActions.rememberFocusTarget).toHaveBeenCalledWith(
      "saved-attempt.webp",
    );
    expect(routeActions.openAddFace).toHaveBeenCalledOnce();
  });

  it.each([
    ["malformed", "http://["],
    ["cross-origin", "https://rejected.example/private-crop.webp"],
  ])(
    "rejects a %s filepath before forwarding or fetching and preserves manual recovery",
    (_name, rejectedFilepath) => {
      const routeActions = actions();
      const fetchMock = vi.fn();
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
      const consoleWarn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      vi.stubGlobal("fetch", fetchMock);

      identifySavedFaceAttempt(attempt(rejectedFilepath), routeActions);

      expect(routeActions.forwardInitialImageLink).not.toHaveBeenCalled();
      expect(routeActions.clearInitialImageLink).toHaveBeenCalledOnce();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(routeActions.openAddFace).toHaveBeenCalledOnce();
      expect(routeActions.rememberFocusTarget).toHaveBeenCalledWith(
        "saved-attempt.webp",
      );
      expect(
        JSON.stringify([
          ...consoleError.mock.calls,
          ...consoleLog.mock.calls,
          ...consoleWarn.mock.calls,
        ]),
      ).not.toContain(rejectedFilepath);
    },
  );
});
