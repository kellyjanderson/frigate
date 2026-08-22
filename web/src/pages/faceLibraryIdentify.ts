import { baseUrl } from "@/api/baseUrl";
import { ClassificationItemData } from "@/types/classification";

type IdentifySavedFaceAttemptActions = {
  clearInitialImageLink: () => void;
  forwardInitialImageLink: (link: string) => void;
  openAddFace: () => void;
  rememberFocusTarget: (filename: string) => void;
};

export function identifySavedFaceAttempt(
  data: ClassificationItemData,
  actions: IdentifySavedFaceAttemptActions,
) {
  let initialImageLink: string | undefined;
  try {
    const resolved = new URL(data.filepath, baseUrl);
    if (resolved.origin === window.location.origin) {
      initialImageLink = resolved.href;
    }
  } catch {
    // Invalid crop links retain the existing manual image-entry route.
  }

  actions.rememberFocusTarget(data.filename);
  if (initialImageLink) {
    actions.forwardInitialImageLink(initialImageLink);
  } else {
    actions.clearInitialImageLink();
  }
  actions.openAddFace();
}
