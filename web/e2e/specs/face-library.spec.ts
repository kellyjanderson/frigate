/**
 * Face Library page tests -- HIGH tier.
 *
 * Collection selector, face tiles, grouped recent-recognition dialog
 * (migrated from radix-overlay-regressions.spec.ts), and mobile
 * library selector.
 */

import { type Locator } from "@playwright/test";
import { test, expect, type FrigateApp } from "../fixtures/frigate-test";
import {
  basicFacesMock,
  emptyFacesMock,
  withGroupedTrainingAttempt,
} from "../fixtures/mock-data/faces";
import {
  expectBodyInteractive,
  waitForBodyInteractive,
} from "../helpers/overlay-interaction";
import { REVIEW_PADDING } from "../../src/types/review";

const GROUPED_EVENT_ID = "1775487131.3863528-abc123";
const GROUPED_EVENT = {
  id: GROUPED_EVENT_ID,
  label: "person",
  sub_label: null,
  camera: "front_door",
  start_time: 1775487131.3863528,
  end_time: 1775487161.3863528,
  false_positive: false,
  zones: ["front_yard"],
  thumbnail: null,
  has_clip: true,
  has_snapshot: true,
  retain_indefinitely: false,
  plus_id: null,
  model_hash: "abc123",
  detector_type: "cpu",
  model_type: "ssd",
  data: {
    top_score: 0.92,
    score: 0.92,
    region: [0.1, 0.1, 0.5, 0.8],
    box: [0.2, 0.15, 0.45, 0.75],
    area: 0.18,
    ratio: 0.6,
    type: "object",
    path_data: [],
  },
};

function groupedFacesMock() {
  return withGroupedTrainingAttempt(basicFacesMock(), {
    eventId: GROUPED_EVENT_ID,
    attempts: [
      { timestamp: 1775487131.3863528, label: "unknown", score: 0.95 },
      { timestamp: 1775487132.3863528, label: "unknown", score: 0.91 },
    ],
  });
}

async function installGroupedFaces(app: FrigateApp) {
  await app.api.install({
    events: [GROUPED_EVENT],
    faces: groupedFacesMock(),
  });
  await app.page.route("**/api/event_ids*", (route) =>
    route.fulfill({ json: [GROUPED_EVENT] }),
  );
}

async function openGroupedFaceDialog(
  app: FrigateApp,
  installMocks: boolean = true,
  expectedAttemptCount: number = 2,
) {
  if (installMocks) {
    await installGroupedFaces(app);
  }
  await app.goto("/faces");
  const groupedImage = app.page
    .locator('img[src*="clips/faces/train/"]')
    .first();
  const groupedCard = groupedImage.locator("xpath=..");
  await expect(groupedImage).toBeVisible({ timeout: 5_000 });
  const listThumbnailBox = await groupedImage.boundingBox();
  expect(listThumbnailBox).not.toBeNull();
  await groupedCard.click();
  const detail = app.isMobile
    ? app.page
        .locator("div.fixed.inset-0.z-50")
        .filter({ has: app.page.locator('img[src*="clips/faces/train/"]') })
        .first()
    : app.page
        .getByRole("dialog")
        .filter({ has: app.page.locator('img[src*="clips/faces/train/"]') })
        .first();
  await expect(detail).toBeVisible({ timeout: 5_000 });
  await expect(detail.locator('img[src*="clips/faces/train/"]')).toHaveCount(
    expectedAttemptCount,
  );
  return { detail, listThumbnailBox: listThumbnailBox! };
}

function addFaceWizard(app: FrigateApp) {
  const heading = app.page.getByRole("heading", { name: "Add Face" });
  return app.isMobile
    ? app.page.locator("div.fixed.inset-0").filter({ has: heading }).last()
    : app.page.getByRole("dialog").filter({ has: heading }).last();
}

async function advanceAddFaceName(app: FrigateApp, name: string) {
  const wizard = addFaceWizard(app);
  await expect(wizard).toBeVisible({ timeout: 5_000 });
  await wizard.locator("input").fill(name);
  await wizard.getByRole("button", { name: "Next" }).click();
  return wizard;
}

async function closeOverlay(app: FrigateApp, overlay: Locator) {
  await overlay
    .getByRole("button", { name: app.isMobile ? "Back" : "Close" })
    .click();
  await expect(overlay).not.toBeVisible({ timeout: 5_000 });
}

async function expectWizardContained(app: FrigateApp, wizard: Locator) {
  const viewport = app.page.viewportSize();
  const box = await wizard.boundingBox();
  expect(viewport).not.toBeNull();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1);
  expect(box!.width).toBeLessThanOrEqual(viewport!.width);
  await expect
    .poll(() =>
      wizard.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    )
    .toBe(true);
}

async function openIdentifiedWizard(
  app: FrigateApp,
  attemptIndex: number,
  name: string,
) {
  const { detail } = await openGroupedFaceDialog(app, false);
  const identifyActions = detail.getByRole("button", { name: "Identify" });
  await expect(identifyActions).toHaveCount(2);
  await identifyActions.nth(attemptIndex).click();
  const wizard = await advanceAddFaceName(app, name);
  await expectWizardContained(app, wizard);
  return { detail, wizard };
}

test.describe("Face Library - identify saved attempt route @high", () => {
  const validWebp = Buffer.from(
    "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",
    "base64",
  );

  test("registers the exact identified crop through the existing Add Face flow", async ({
    frigateApp,
  }) => {
    let hydratedCropUrl: string | undefined;
    let registrationUrl: string | undefined;
    let registrationBody: Buffer | null = null;

    await installGroupedFaces(frigateApp);
    let selectedFilename = "";
    const selectedMarker = Buffer.from("selected-attempt-two");

    await frigateApp.page.route("**/clips/faces/train/*", async (route) => {
      const request = route.request();
      const filename = decodeURIComponent(new URL(request.url()).pathname)
        .split("/")
        .pop();
      if (request.resourceType() === "fetch") {
        hydratedCropUrl = request.url();
      }
      await route.fulfill({
        status: 200,
        contentType: "image/webp",
        body: Buffer.concat([
          validWebp,
          filename === selectedFilename
            ? selectedMarker
            : Buffer.from("other-attempt"),
        ]),
      });
    });
    await frigateApp.page.route(
      "**/api/faces/route_person/register",
      (route) => {
        registrationUrl = route.request().url();
        registrationBody = route.request().postDataBuffer();
        return route.fulfill({ json: { success: true } });
      },
    );

    const { detail } = await openGroupedFaceDialog(frigateApp, false);
    const identifyActions = detail.getByRole("button", { name: "Identify" });
    await expect(identifyActions).toHaveCount(2);
    selectedFilename =
      (await identifyActions
        .nth(1)
        .getAttribute("data-face-identify-action")) ?? "";
    expect(selectedFilename).not.toBe("");
    await identifyActions.nth(1).click();

    const wizard = await advanceAddFaceName(frigateApp, "route_person");
    await expect
      .poll(() => hydratedCropUrl)
      .toContain(`/clips/faces/train/${selectedFilename}`);
    await expect(wizard.getByRole("img", { name: "Preview" })).toBeVisible();
    await wizard.getByRole("button", { name: "Next" }).click();

    await expect
      .poll(() => registrationUrl)
      .toContain("/api/faces/route_person/register");
    expect(registrationBody).not.toBeNull();
    expect(registrationBody!.includes(Buffer.from('name="file"'))).toBe(true);
    expect(registrationBody!.includes(Buffer.from(selectedFilename))).toBe(
      true,
    );
    expect(registrationBody!.includes(selectedMarker)).toBe(true);
    await expect(wizard.getByRole("button", { name: "Done" })).toBeVisible();
  });

  test("clears identified state on close and toolbar Add Face", async ({
    frigateApp,
  }) => {
    let hydrationFetches = 0;

    await installGroupedFaces(frigateApp);
    await frigateApp.page.route("**/clips/faces/train/*", async (route) => {
      if (route.request().resourceType() === "fetch") {
        hydrationFetches += 1;
      }
      await route.fulfill({
        status: 200,
        contentType: "image/webp",
        body: validWebp,
      });
    });

    const { detail } = await openGroupedFaceDialog(frigateApp, false);
    const identifyAction = detail
      .getByRole("button", { name: "Identify" })
      .first();
    if (frigateApp.isMobile) {
      await identifyAction.tap();
    } else {
      await identifyAction.focus();
      await identifyAction.press("Enter");
    }

    const wizard = await advanceAddFaceName(frigateApp, "reset_person");
    await expect.poll(() => hydrationFetches).toBe(1);
    await expect(wizard.getByRole("img", { name: "Preview" })).toBeVisible();
    await closeOverlay(frigateApp, wizard);
    if (frigateApp.isMobile) {
      await expect(
        frigateApp.page.getByRole("button", { name: "Add Face" }),
      ).toBeVisible();
      await expect(
        frigateApp.page.locator("#face-library-selector"),
      ).toBeFocused();
    } else {
      await expect(identifyAction).toBeVisible();
      await expect(identifyAction).toBeFocused();
      await closeOverlay(frigateApp, detail);
    }

    await frigateApp.page.getByRole("button", { name: "Add Face" }).click();
    const emptyWizard = await advanceAddFaceName(frigateApp, "empty_person");
    await expect(emptyWizard.getByRole("img", { name: "Preview" })).toHaveCount(
      0,
    );
    await expect(emptyWizard.getByText("Drag and drop or paste")).toBeVisible();
    expect(hydrationFetches).toBe(1);
    await closeOverlay(frigateApp, emptyWizard);
    await waitForBodyInteractive(frigateApp.page);
    await expectBodyInteractive(frigateApp.page);
  });

  test("rejects cross-origin redirects and invalid crop responses without exposing their URLs or registering", async ({
    frigateApp,
  }) => {
    const rejectedUrl = "https://rejected.example/private-crop.webp";
    let registrationRequests = 0;
    let manualRegistrationBody: Buffer | null = null;

    await installGroupedFaces(frigateApp);
    await frigateApp.page.route(rejectedUrl, (route) =>
      route.fulfill({
        status: 200,
        contentType: "image/webp",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: validWebp,
      }),
    );
    await frigateApp.page.route("**/clips/faces/train/*", (route) => {
      const filename = decodeURIComponent(
        new URL(route.request().url()).pathname,
      )
        .split("/")
        .pop();
      if (filename?.includes("1775487131.3863528")) {
        return route.fulfill({
          status: 302,
          headers: { Location: rejectedUrl },
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "malformed crop payload",
      });
    });
    await frigateApp.page.route("**/api/faces/*/register", (route) => {
      registrationRequests += 1;
      manualRegistrationBody = route.request().postDataBuffer();
      return route.fulfill({ json: { success: true } });
    });

    const crossOrigin = await openIdentifiedWizard(
      frigateApp,
      0,
      "rejected_person",
    );
    await expect(
      crossOrigin.wizard.getByText("The image could not be loaded"),
    ).toBeVisible();
    await expect(
      crossOrigin.wizard.getByRole("button", { name: "Next" }),
    ).toBeDisabled();
    await expect(crossOrigin.wizard).not.toContainText(rejectedUrl);
    expect(
      await crossOrigin.wizard.evaluate((element) => element.outerHTML),
    ).not.toContain("rejected.example");
    expect(registrationRequests).toBe(0);
    await closeOverlay(frigateApp, crossOrigin.wizard);

    const invalid = await openIdentifiedWizard(
      frigateApp,
      1,
      "manual_recovery",
    );
    await expect(
      invalid.wizard.getByText("The image could not be loaded"),
    ).toBeVisible();
    expect(registrationRequests).toBe(0);

    const manualMarker = Buffer.from("manual-recovery-bytes");
    await invalid.wizard.locator('input[type="file"]').setInputFiles({
      name: "manual.webp",
      mimeType: "image/webp",
      buffer: Buffer.concat([validWebp, manualMarker]),
    });
    await expect(
      invalid.wizard.getByRole("img", { name: "Preview" }),
    ).toBeVisible();
    await invalid.wizard.getByRole("button", { name: "Next" }).click();
    await expect.poll(() => registrationRequests).toBe(1);
    expect(manualRegistrationBody).not.toBeNull();
    expect(manualRegistrationBody!.includes(manualMarker)).toBe(true);
    expect(
      manualRegistrationBody!.includes(Buffer.from("malformed crop payload")),
    ).toBe(false);
  });

  test("blocks pending submission and registers only current replacement bytes", async ({
    frigateApp,
  }) => {
    let releaseHydration!: () => void;
    const hydrationGate = new Promise<void>((resolve) => {
      releaseHydration = resolve;
    });
    let registrationRequests = 0;
    let registrationBody: Buffer | null = null;
    const staleMarker = Buffer.from("stale-initial-crop");
    const replacementMarker = Buffer.from("current-replacement-crop");

    await installGroupedFaces(frigateApp);
    await frigateApp.page.route("**/clips/faces/train/*", async (route) => {
      if (route.request().resourceType() === "fetch") {
        await hydrationGate;
      }
      await route
        .fulfill({
          status: 200,
          contentType: "image/webp",
          body: Buffer.concat([validWebp, staleMarker]),
        })
        .catch(() => undefined);
    });
    await frigateApp.page.route("**/api/faces/*/register", (route) => {
      registrationRequests += 1;
      registrationBody = route.request().postDataBuffer();
      return route.fulfill({ json: { success: true } });
    });

    const { wizard } = await openIdentifiedWizard(
      frigateApp,
      0,
      "replacement_person",
    );
    await expect(wizard.locator("form")).toHaveAttribute("aria-busy", "true");
    await expect(wizard.getByText("Loading image")).toBeVisible();
    await expect(wizard.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(registrationRequests).toBe(0);

    await wizard.locator('input[type="file"]').setInputFiles({
      name: "replacement.webp",
      mimeType: "image/webp",
      buffer: Buffer.concat([validWebp, replacementMarker]),
    });
    releaseHydration();
    await expect(wizard.locator("form")).toHaveAttribute("aria-busy", "false");
    await expect(wizard.getByRole("img", { name: "Preview" })).toBeVisible();
    await wizard.getByRole("button", { name: "Next" }).click();

    await expect.poll(() => registrationRequests).toBe(1);
    expect(registrationBody).not.toBeNull();
    expect(registrationBody!.includes(replacementMarker)).toBe(true);
    expect(registrationBody!.includes(staleMarker)).toBe(false);
  });

  test("removal prevents registration and stale hydration cannot restore the crop", async ({
    frigateApp,
  }) => {
    let releaseHydration!: () => void;
    const hydrationGate = new Promise<void>((resolve) => {
      releaseHydration = resolve;
    });
    let registrationRequests = 0;

    await installGroupedFaces(frigateApp);
    await frigateApp.page.route("**/clips/faces/train/*", async (route) => {
      if (route.request().resourceType() === "fetch") {
        await hydrationGate;
      }
      await route
        .fulfill({ status: 200, contentType: "image/webp", body: validWebp })
        .catch(() => undefined);
    });
    await frigateApp.page.route("**/api/faces/*/register", (route) => {
      registrationRequests += 1;
      return route.fulfill({ json: { success: true } });
    });

    const { wizard } = await openIdentifiedWizard(
      frigateApp,
      0,
      "removed_person",
    );
    await wizard.getByRole("button", { name: "Remove initial image" }).click();
    releaseHydration();
    await expect(wizard.getByRole("img", { name: "Preview" })).toHaveCount(0);
    await expect(wizard.getByText("Drag and drop or paste")).toBeVisible();
    await expect(wizard.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(registrationRequests).toBe(0);
  });

  test("closing before hydration prevents stale state in toolbar Add Face", async ({
    frigateApp,
  }) => {
    let releaseHydration!: () => void;
    const hydrationGate = new Promise<void>((resolve) => {
      releaseHydration = resolve;
    });
    let registrationRequests = 0;

    await installGroupedFaces(frigateApp);
    await frigateApp.page.route("**/clips/faces/train/*", async (route) => {
      if (route.request().resourceType() === "fetch") {
        await hydrationGate;
      }
      await route
        .fulfill({ status: 200, contentType: "image/webp", body: validWebp })
        .catch(() => undefined);
    });
    await frigateApp.page.route("**/api/faces/*/register", (route) => {
      registrationRequests += 1;
      return route.fulfill({ json: { success: true } });
    });

    const { detail, wizard } = await openIdentifiedWizard(
      frigateApp,
      0,
      "closed_person",
    );
    await expect(wizard.getByText("Loading image")).toBeVisible();
    await closeOverlay(frigateApp, wizard);
    releaseHydration();
    if (!frigateApp.isMobile) {
      await closeOverlay(frigateApp, detail);
    }

    await frigateApp.page.getByRole("button", { name: "Add Face" }).click();
    const emptyWizard = await advanceAddFaceName(frigateApp, "fresh_person");
    await expectWizardContained(frigateApp, emptyWizard);
    await expect(emptyWizard.getByRole("img", { name: "Preview" })).toHaveCount(
      0,
    );
    await expect(emptyWizard.getByText("Loading image")).toHaveCount(0);
    await expect(
      emptyWizard.getByText("The image could not be loaded"),
    ).toHaveCount(0);
    await expect(emptyWizard.getByText("Drag and drop or paste")).toBeVisible();
    await expect(
      emptyWizard.getByRole("button", { name: "Next" }),
    ).toBeDisabled();
    expect(registrationRequests).toBe(0);
  });
});

test.describe("Face Library — local not-a-face rejection @high", () => {
  test.use({
    expectedErrors: [
      /500.*\/api\/faces\/train\/delete|Failed to load resource.*500/,
    ],
  });

  test("cancels or removes exactly one crop and keeps the removal after reload", async ({
    frigateApp,
  }) => {
    let faces = groupedFacesMock();
    let selectedFilename = "";
    let siblingFilename = "";
    let deleteRequests = 0;
    let deleteUrl: string | undefined;
    let deleteBody: unknown;

    await installGroupedFaces(frigateApp);
    await frigateApp.page.route("**/api/faces", (route) =>
      route.fulfill({ json: faces }),
    );
    await frigateApp.page.route("**/api/faces/train/delete", async (route) => {
      deleteRequests += 1;
      deleteUrl = route.request().url();
      deleteBody = route.request().postDataJSON();
      const [requestedFilename] = (deleteBody as { ids: string[] }).ids;
      faces = {
        ...faces,
        train: faces.train.filter((filename) => filename !== requestedFilename),
      };
      await route.fulfill({ json: { success: true } });
    });

    const { detail } = await openGroupedFaceDialog(frigateApp, false);
    const rejectionActions = detail.getByRole("button", {
      name: "That's not a face",
    });
    await expect(rejectionActions).toHaveCount(2);
    selectedFilename =
      (await rejectionActions
        .first()
        .getAttribute("data-face-rejection-action")) ?? "";
    siblingFilename = faces.train.find(
      (filename) => filename !== selectedFilename,
    )!;

    const actionBox = await rejectionActions.first().boundingBox();
    expect(actionBox).not.toBeNull();
    expect(actionBox!.height).toBeGreaterThanOrEqual(44);

    await rejectionActions.first().click();
    const confirmation = frigateApp.page.getByRole("alertdialog");
    await expect(confirmation).toBeVisible();
    await expect(confirmation).toContainText("event and recording will remain");
    expect(deleteRequests).toBe(0);

    await confirmation.getByRole("button", { name: "Cancel" }).click();
    await expect(confirmation).not.toBeVisible();
    expect(deleteRequests).toBe(0);
    await expect(rejectionActions.first()).toBeVisible();
    await expect(
      detail.getByRole("button", { name: "That's not a face" }),
    ).toHaveCount(2);

    await rejectionActions.first().click();
    await confirmation.getByRole("button", { name: "Remove crop" }).click();

    await expect.poll(() => deleteRequests).toBe(1);
    expect(deleteUrl).toMatch(/\/api\/faces\/train\/delete$/);
    expect(deleteBody).toEqual({ ids: [selectedFilename] });
    await expect(confirmation).not.toBeVisible();
    await expect(detail.locator(`img[src*="${selectedFilename}"]`)).toHaveCount(
      0,
    );
    await expect(
      detail.locator(`img[src*="${siblingFilename}"]`),
    ).toBeVisible();
    await expect(
      detail.getByRole("button", { name: "That's not a face" }),
    ).toBeFocused();
    await expect(
      frigateApp.page.getByText("Successfully deleted 1 face."),
    ).toBeVisible();

    await frigateApp.page.reload();
    await expect(
      frigateApp.page.locator(`img[src*="${selectedFilename}"]`),
    ).toHaveCount(0);
    await expect(
      frigateApp.page.locator(`img[src*="${siblingFilename}"]`),
    ).toBeVisible();
  });

  test("holds one request pending, preserves failures, and permits one retry", async ({
    frigateApp,
  }) => {
    let faces = groupedFacesMock();
    let selectedFilename = "";
    let deleteRequests = 0;
    let releaseFailure!: () => void;
    const heldFailure = new Promise<void>((resolve) => {
      releaseFailure = resolve;
    });

    await installGroupedFaces(frigateApp);
    await frigateApp.page.route("**/api/faces", (route) =>
      route.fulfill({ json: faces }),
    );
    await frigateApp.page.route("**/api/faces/train/delete", async (route) => {
      deleteRequests += 1;

      if (deleteRequests === 1) {
        await heldFailure;
        await route.fulfill({
          status: 500,
          json: { message: "Disposable delete failure" },
        });
        return;
      }

      const deleteBody = route.request().postDataJSON() as { ids: string[] };
      faces = {
        ...faces,
        train: faces.train.filter((filename) => filename !== deleteBody.ids[0]),
      };
      await route.fulfill({ json: { success: true } });
    });

    const { detail } = await openGroupedFaceDialog(frigateApp, false);
    const rejectionAction = detail
      .getByRole("button", { name: "That's not a face" })
      .first();
    selectedFilename =
      (await rejectionAction.getAttribute("data-face-rejection-action")) ?? "";
    await rejectionAction.click();
    const confirmation = frigateApp.page.getByRole("alertdialog");
    const confirm = confirmation.locator("[data-not-face-confirm]");
    const cancel = confirmation.getByRole("button", { name: "Cancel" });
    await confirm.click();

    await expect.poll(() => deleteRequests).toBe(1);
    await expect(confirmation).toBeVisible();
    await expect(confirm).toBeDisabled();
    await expect(cancel).toBeDisabled();
    await confirm.evaluate((button: HTMLButtonElement) => button.click());
    await expect.poll(() => deleteRequests).toBe(1);

    releaseFailure();
    await expect(confirm).toBeEnabled();
    await expect(cancel).toBeEnabled();
    await expect(confirmation).toBeVisible();
    await expect(
      frigateApp.page.locator(
        `[data-face-rejection-action="${selectedFilename}"]`,
      ),
    ).toBeAttached();
    await expect(
      frigateApp.page.locator("[data-face-rejection-action]"),
    ).toHaveCount(2);
    await expect(
      frigateApp.page.getByText("Failed to delete: Disposable delete failure"),
    ).toBeVisible();
    await expect(
      frigateApp.page.getByText("Successfully deleted 1 face."),
    ).toHaveCount(0);

    await confirm.click();
    await expect.poll(() => deleteRequests).toBe(2);
    await expect(confirmation).not.toBeVisible();
    await expect(detail.locator(`img[src*="${selectedFilename}"]`)).toHaveCount(
      0,
    );
  });

  test("removing the last attempt restores the established empty state", async ({
    frigateApp,
  }) => {
    let faces = withGroupedTrainingAttempt(basicFacesMock(), {
      eventId: GROUPED_EVENT_ID,
      attempts: [
        { timestamp: 1775487131.3863528, label: "unknown", score: 0.95 },
      ],
    });

    await frigateApp.api.install({ events: [GROUPED_EVENT], faces });
    await frigateApp.page.route("**/api/event_ids*", (route) =>
      route.fulfill({ json: [GROUPED_EVENT] }),
    );
    await frigateApp.page.route("**/api/faces", (route) =>
      route.fulfill({ json: faces }),
    );
    await frigateApp.page.route("**/api/faces/train/delete", async (route) => {
      faces = { ...faces, train: [] };
      await route.fulfill({ json: { success: true } });
    });

    const { detail } = await openGroupedFaceDialog(frigateApp, false, 1);
    await detail.getByRole("button", { name: "That's not a face" }).click();
    await frigateApp.page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Remove crop" })
      .click();

    await expect(
      frigateApp.page.getByText(
        "There are no recent face recognition attempts",
      ),
    ).toBeVisible();
    await expect(
      frigateApp.page.locator("#face-library-selector"),
    ).toBeFocused();
  });
});

test.describe("Face Library — recognition media detail @high", () => {
  test("unknown recognition opens full frame and playback at detection time", async ({
    frigateApp,
  }) => {
    const detectionTimestamp = 1775487131.3863528;
    let requestedPlaylist: string | undefined;

    await frigateApp.page.route(/\/recordings\/.*\/snapshot\.jpg/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"/>',
      }),
    );
    await frigateApp.page.route(/\/vod\/.*\/index\.m3u8/, (route) => {
      requestedPlaylist = route.request().url();
      return route.fulfill({
        status: 200,
        contentType: "application/vnd.apple.mpegurl",
        body: "#EXTM3U\n#EXT-X-ENDLIST\n",
      });
    });

    const { detail, listThumbnailBox } =
      await openGroupedFaceDialog(frigateApp);
    const detailFaceBox = await detail
      .locator('img[src*="clips/faces/train/"]')
      .first()
      .boundingBox();
    expect(detailFaceBox).not.toBeNull();
    expect(detailFaceBox!.width).toBeGreaterThan(listThumbnailBox.width);
    expect(detailFaceBox!.height).toBeGreaterThan(listThumbnailBox.height);
    const tabs = frigateApp.page.getByRole("tablist", {
      name: "Face detection details",
    });
    await expect(tabs.getByRole("tab")).toHaveCount(3);

    await tabs.getByRole("tab", { name: "Full frame" }).click();
    const fullFrame = frigateApp.page.getByRole("img", {
      name: /Full camera frame for the face detection/,
    });
    await expect(fullFrame).toBeVisible();
    await expect(fullFrame).toHaveAttribute(
      "src",
      new RegExp(
        `/api/front_door/recordings/${detectionTimestamp}/snapshot\\.jpg$`,
      ),
    );

    await tabs.getByRole("tab", { name: "Playback" }).click();
    await expect
      .poll(() => requestedPlaylist)
      .toContain(
        `/vod/front_door/start/${detectionTimestamp - REVIEW_PADDING}/end/${GROUPED_EVENT.end_time + REVIEW_PADDING}/index.m3u8`,
      );
  });
});

/**
 * Opens the LibrarySelector dropdown (the single button at the top-left of
 * the Face Library page) and returns the dropdown menu locator.
 *
 * The LibrarySelector is a single DropdownMenu whose trigger shows the
 * current tab name + count (e.g. "Recent Recognitions (0)"). Named face
 * collections (alice, bob, charlie) are items inside this dropdown.
 */
async function openLibraryDropdown(app: FrigateApp): Promise<Locator> {
  // The trigger is the first button on the page with a parenthesised count.
  const trigger = app.page
    .getByRole("button")
    .filter({ hasText: /\(\d+\)/ })
    .first();
  await expect(trigger).toBeVisible({ timeout: 10_000 });
  await trigger.click();
  const menu = app.page
    .locator('[role="menu"], [data-radix-menu-content]')
    .first();
  await expect(menu).toBeVisible({ timeout: 5_000 });
  return menu;
}

test.describe("Face Library — collection selector @high", () => {
  test("selector shows named face collections", async ({ frigateApp }) => {
    await frigateApp.installDefaults({ faces: basicFacesMock() });
    await frigateApp.goto("/faces");
    // Named collections appear in the LibrarySelector dropdown.
    const menu = await openLibraryDropdown(frigateApp);
    await expect(menu.getByText(/alice/i).first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("empty state renders when no faces exist", async ({ frigateApp }) => {
    await frigateApp.installDefaults({ faces: emptyFacesMock() });
    await frigateApp.goto("/faces");
    await expect(frigateApp.page.locator("#pageRoot")).toBeVisible();
    await expect(
      frigateApp.page.locator('img[src*="/clips/faces/"]'),
    ).toHaveCount(0);
  });

  test("tiles render for each named collection", async ({ frigateApp }) => {
    await frigateApp.installDefaults({ faces: basicFacesMock() });
    await frigateApp.goto("/faces");
    // Open the dropdown — collections list shows "alice (2)" and "bob (1)".
    const menu = await openLibraryDropdown(frigateApp);
    await expect(
      menu.locator('[role="menuitem"]').filter({ hasText: /alice/i }).first(),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      menu.locator('[role="menuitem"]').filter({ hasText: /bob/i }).first(),
    ).toBeVisible();
  });
});

test.describe("Face Library — delete flow (desktop) @high", () => {
  test.skip(
    ({ frigateApp }) => frigateApp.isMobile,
    "Delete action menu is desktop-focused",
  );

  test("deleting a collection fires POST /faces/<name>/delete", async ({
    frigateApp,
  }) => {
    let deleteUrl: string | null = null;
    let deleteBody: unknown = null;
    // Install base mocks first, then register our more-specific route AFTER
    // so it takes priority over the ApiMocker catch-all (Playwright LIFO order).
    await frigateApp.installDefaults({ faces: basicFacesMock() });
    await frigateApp.page.route(
      /\/api\/faces\/[^/]+\/delete/,
      async (route) => {
        deleteUrl = route.request().url();
        deleteBody = route.request().postDataJSON();
        await route.fulfill({ json: { success: true } });
      },
    );
    await frigateApp.goto("/faces");

    // Open the LibrarySelector dropdown and click the trash icon next
    // to the alice row. The trash icon is a ghost-variant Button inside
    // the DropdownMenuItem — it becomes visible on hover/focus.
    const menu = await openLibraryDropdown(frigateApp);
    const aliceRow = menu
      .locator('[role="menuitem"]')
      .filter({ hasText: /alice/i })
      .first();
    await expect(aliceRow).toBeVisible({ timeout: 5_000 });
    // Hover first to make hover-only opacity-0 buttons visible.
    await aliceRow.hover();
    // The icon buttons have no aria-label or title. The row renders exactly
    // two buttons in fixed source order: [0] LuPencil (rename), [1] LuTrash2
    // (delete). This order is determined by FaceLibrary.tsx and is stable.
    const trashBtn = aliceRow.locator("button").nth(1);
    await trashBtn.click();

    // The delete confirmation is a Dialog (not AlertDialog) in this flow.
    const dialog = frigateApp.page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog
      .getByRole("button", { name: /delete/i })
      .first()
      .click();

    await expect
      .poll(() => deleteUrl, { timeout: 5_000 })
      .toMatch(/\/faces\/alice\/delete/);
    expect(deleteBody).toMatchObject({ ids: expect.any(Array) });
  });
});

test.describe("Face Library — rename flow (desktop) @high", () => {
  test.skip(
    ({ frigateApp }) => frigateApp.isMobile,
    "Rename action menu is desktop-focused",
  );

  test("renaming a collection fires PUT /faces/<name>/rename", async ({
    frigateApp,
  }) => {
    let renameUrl: string | null = null;
    let renameBody: unknown = null;
    // Install base mocks first, then register our more-specific route AFTER
    // so it takes priority over the ApiMocker catch-all (Playwright LIFO order).
    await frigateApp.installDefaults({ faces: basicFacesMock() });
    await frigateApp.page.route(
      /\/api\/faces\/[^/]+\/rename/,
      async (route) => {
        renameUrl = route.request().url();
        renameBody = route.request().postDataJSON();
        await route.fulfill({ json: { success: true } });
      },
    );
    await frigateApp.goto("/faces");

    // Open the LibrarySelector dropdown and click the pencil (rename) icon
    // next to alice. The icon is a ghost Button inside the DropdownMenuItem.
    const menu = await openLibraryDropdown(frigateApp);
    const aliceRow = menu
      .locator('[role="menuitem"]')
      .filter({ hasText: /alice/i })
      .first();
    await expect(aliceRow).toBeVisible({ timeout: 5_000 });
    await aliceRow.hover();
    // The icon buttons have no aria-label or title. The row renders exactly
    // two buttons in fixed source order: [0] LuPencil (rename), [1] LuTrash2
    // (delete). This order is determined by FaceLibrary.tsx and is stable.
    const pencilBtn = aliceRow.locator("button").nth(0);
    await pencilBtn.click();

    // TextEntryDialog — fill the input and confirm.
    const dialog = frigateApp.page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.locator("input").first().fill("alice_renamed");
    await dialog
      .getByRole("button", { name: /save|rename|confirm/i })
      .first()
      .click();

    await expect
      .poll(() => renameUrl, { timeout: 5_000 })
      .toMatch(/\/faces\/alice\/rename/);
    expect(renameBody).toEqual({ new_name: "alice_renamed" });
  });
});

test.describe("Face Library — upload flow @high", () => {
  test.skip(
    ({ frigateApp }) => frigateApp.isMobile,
    "Upload button has no accessible text on mobile — icon-only on narrow viewports",
  );

  test("Upload button opens the upload dialog", async ({ frigateApp }) => {
    await frigateApp.installDefaults({ faces: basicFacesMock() });
    await frigateApp.goto("/faces");

    // Navigate to the alice tab by opening the dropdown and clicking alice.
    const menu = await openLibraryDropdown(frigateApp);
    await menu
      .locator('[role="menuitem"]')
      .filter({ hasText: /alice/i })
      .first()
      .click();

    // After switching to alice, the Upload Image button appears in the toolbar.
    const uploadBtn = frigateApp.page
      .getByRole("button")
      .filter({ hasText: /upload/i })
      .first();
    await expect(uploadBtn).toBeVisible({ timeout: 5_000 });
    await uploadBtn.click();

    // UploadImageDialog renders a file input + confirm button.
    const dialog = frigateApp.page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.locator('input[type="file"]')).toHaveCount(1);
  });
});

test.describe("FaceSelectionDialog @high", () => {
  test.skip(
    ({ frigateApp }) => frigateApp.isMobile,
    "Grouped dropdown flow is desktop-only",
  );

  test("reclassify dropdown selects a name and closes cleanly", async ({
    frigateApp,
  }) => {
    // Migrated from radix-overlay-regressions.spec.ts.
    const { detail: dialog } = await openGroupedFaceDialog(frigateApp);
    const triggers = dialog.locator('[aria-haspopup="menu"]');
    await expect(triggers).toHaveCount(2);

    await triggers.first().click();
    const menu = frigateApp.page
      .locator('[role="menu"], [data-radix-menu-content]')
      .first();
    await expect(menu).toBeVisible({ timeout: 5_000 });

    await menu.getByRole("menuitem", { name: /^bob$/i }).click();

    await expect(menu).not.toBeVisible({ timeout: 3_000 });
    await expect(dialog).toBeVisible();

    const tooltipVisible = await frigateApp.page
      .locator('[role="tooltip"]')
      .filter({ hasText: /train face/i })
      .isVisible()
      .catch(() => false);
    expect(
      tooltipVisible,
      "Train Face tooltip popped after dropdown closed — focus-restore regression",
    ).toBe(false);
  });

  test("second dropdown open accepts typeahead keyboard input", async ({
    frigateApp,
  }) => {
    // Migrated from radix-overlay-regressions.spec.ts.
    const { detail: dialog } = await openGroupedFaceDialog(frigateApp);
    const triggers = dialog.locator('[aria-haspopup="menu"]');
    await expect(triggers).toHaveCount(2);

    await triggers.first().click();
    let menu = frigateApp.page
      .locator('[role="menu"], [data-radix-menu-content]')
      .first();
    await expect(menu).toBeVisible({ timeout: 5_000 });
    await menu.getByRole("menuitem", { name: /^bob$/i }).click();
    await expect(menu).not.toBeVisible({ timeout: 3_000 });

    await triggers.nth(1).click();
    menu = frigateApp.page
      .locator('[role="menu"], [data-radix-menu-content]')
      .first();
    await expect(menu).toBeVisible({ timeout: 5_000 });

    await frigateApp.page.keyboard.press("c");
    await expect
      .poll(
        async () =>
          frigateApp.page.evaluate(
            () =>
              document.activeElement?.textContent?.trim().toLowerCase() ?? "",
          ),
        { timeout: 2_000 },
      )
      .toMatch(/^charlie/);

    await frigateApp.page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible({ timeout: 3_000 });
  });

  test("classifying the last image in a group leaves body interactive", async ({
    frigateApp,
  }) => {
    // Regression guard for the stuck body pointer-events bug when the
    // last image in a grouped-recognition detail Dialog is classified.
    // Tracked upstream at radix-ui/primitives#3445.
    //
    // Root cause: when the user clicks a FaceSelectionDialog menu item,
    // the modal DropdownMenu enters its exit animation (Radix's Presence
    // keeps it in the DOM with data-state="closed" until animationend).
    // While that is in flight the classify axios resolves, SWR removes
    // the image from /api/faces, the parent's map no longer renders the
    // grouped card, and React unmounts the subtree — including the still-
    // animating DropdownMenu's Presence container. DismissableLayer's
    // shared modal-layer stack can't reconcile the interrupted exit, so
    // the `body { pointer-events: none }` entry it put on mount is never
    // popped and the rest of the UI becomes unclickable.
    //
    // The fix is `modal={false}` on the FaceSelectionDialog's
    // DropdownMenu (desktop path only). With modal=false the DropdownMenu
    // never puts an entry on DismissableLayer's body-pointer-events stack
    // in the first place, so there's nothing to leak when its Presence is
    // torn down mid-animation. The Radix-community-documented workaround
    // for #3445.
    //
    // The bug only reproduces when the mock resolves fast enough that
    // the parent unmounts before the dropdown's exit animation finishes.
    // Measured window via a 3x sweep on the pre-fix build: 0–200 ms
    // triggers it; 300 ms+ no longer reproduces. Production LAN networks
    // sit comfortably inside the bad window, while `npm run dev` seems
    // to mask it via React StrictMode's double-effect scheduling.
    const EVENT_ID = "1775487131.3863528-race";
    const initialFaces = withGroupedTrainingAttempt(basicFacesMock(), {
      eventId: EVENT_ID,
      attempts: [
        { timestamp: 1775487131.3863528, label: "unknown", score: 0.95 },
      ],
    });

    let classified = false;

    await frigateApp.installDefaults({
      faces: initialFaces,
      events: [
        {
          id: EVENT_ID,
          label: "person",
          sub_label: null,
          camera: "front_door",
          start_time: 1775487131.3863528,
          end_time: 1775487161.3863528,
          false_positive: false,
          zones: ["front_yard"],
          thumbnail: null,
          has_clip: true,
          has_snapshot: true,
          retain_indefinitely: false,
          plus_id: null,
          model_hash: "abc123",
          detector_type: "cpu",
          model_type: "ssd",
          data: {
            top_score: 0.92,
            score: 0.92,
            region: [0.1, 0.1, 0.5, 0.8],
            box: [0.2, 0.15, 0.45, 0.75],
            area: 0.18,
            ratio: 0.6,
            type: "object",
            path_data: [],
          },
        },
      ],
    });

    // Re-route /api/faces to flip to the "train empty" payload once the
    // classify POST has been received. Registered AFTER installDefaults so
    // Playwright's LIFO route matching hits this handler first.
    await frigateApp.page.route("**/api/faces", async (route) => {
      const payload = classified ? basicFacesMock() : initialFaces;
      await route.fulfill({ json: payload });
    });

    // Hold the classify POST briefly. The race opens when the parent
    // unmounts before the dropdown's exit animation finishes (~200ms
    // in Radix). 100ms keeps us comfortably inside that window and
    // reliably triggered the bug in a 3x sweep across 0/50/100/200ms
    // on the pre-fix build. CLASSIFY_DELAY_MS overrides for local sweeps.
    const delayMs = Number(
      (globalThis as { process?: { env?: Record<string, string> } }).process
        ?.env?.CLASSIFY_DELAY_MS ?? "100",
    );
    await frigateApp.page.route(
      "**/api/faces/train/*/classify",
      async (route) => {
        classified = true;
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        await route.fulfill({ json: { success: true } });
      },
    );

    await frigateApp.goto("/faces");

    // Open the grouped detail Dialog.
    const groupedImage = frigateApp.page
      .locator('img[src*="clips/faces/train/"]')
      .first();
    await expect(groupedImage).toBeVisible({ timeout: 5_000 });
    await groupedImage.locator("xpath=..").click();
    const dialog = frigateApp.page
      .getByRole("dialog")
      .filter({
        has: frigateApp.page.locator('img[src*="clips/faces/train/"]'),
      })
      .first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Single attempt → single `+` trigger.
    const triggers = dialog.locator('[aria-haspopup="menu"]');
    await expect(triggers).toHaveCount(1);
    await triggers.first().click();

    const menu = frigateApp.page
      .locator('[role="menu"], [data-radix-menu-content]')
      .first();
    await expect(menu).toBeVisible({ timeout: 5_000 });
    await menu.getByRole("menuitem", { name: /^alice$/i }).click();

    // The Dialog must leave the tree cleanly, and body must recover.
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // Give Radix's exit animation + cleanup a comfortable margin on top of
    // the ~300ms simulated network delay.
    await waitForBodyInteractive(frigateApp.page, 5_000);
    await expectBodyInteractive(frigateApp.page);

    // User-visible confirmation: click something outside the dialog
    // and assert it actually responds.
    const librarySelector = frigateApp.page
      .getByRole("button")
      .filter({ hasText: /\(\d+\)/ })
      .first();
    await librarySelector.click();
    await expect(
      frigateApp.page
        .locator('[role="menu"], [data-radix-menu-content]')
        .first(),
    ).toBeVisible({ timeout: 3_000 });
  });
});

test.describe("Face Library — mobile @high @mobile", () => {
  test.skip(({ frigateApp }) => !frigateApp.isMobile, "Mobile-only");

  test("mobile library selector dropdown closes cleanly on Escape", async ({
    frigateApp,
  }) => {
    // Migrated from radix-overlay-regressions.spec.ts.
    await installGroupedFaces(frigateApp);
    await frigateApp.goto("/faces");

    const selector = frigateApp.page
      .getByRole("button")
      .filter({ hasText: /\(\d+\)/ })
      .first();
    await expect(selector).toBeVisible({ timeout: 5_000 });
    await selector.click();

    const menu = frigateApp.page
      .locator('[role="menu"], [data-radix-menu-content]')
      .first();
    await expect(menu).toBeVisible({ timeout: 3_000 });

    await frigateApp.page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible({ timeout: 3_000 });
    await waitForBodyInteractive(frigateApp.page);
    await expectBodyInteractive(frigateApp.page);
  });
});
