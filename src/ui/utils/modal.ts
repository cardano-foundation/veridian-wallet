import { HTMLIonOverlayElement } from "@ionic/core";

const BLOCKING_MODALS = ["verify-seedphrase-alert"];

const isOverlayHidden = (overlay: Element) =>
  overlay.classList.contains("overlay-hidden");

// Refer to: https://github.com/ionic-team/ionic-framework/blob/be14dc4bb8bbd7b92e91bde89f11c3c7584aa508/core/src/utils/overlays.ts#L459
const getPresentedOverlays = (
  doc: Document,
  selector: string
): HTMLIonOverlayElement[] => {
  return (Array.from(doc.querySelectorAll(selector)) as HTMLIonOverlayElement[])
    .filter((c) => c.overlayIndex > 0)
    .filter((o) => !isOverlayHidden(o));
};

export const dismissAllModals = (): boolean => {
  const overlays = getPresentedOverlays(document, "ion-modal");

  let result = true;
  for (let index = 0; index < overlays.length; index++) {
    const modal = overlays[index];

    if (
      BLOCKING_MODALS.some((className) => modal.classList.contains(className))
    ) {
      result = false;
      continue;
    }

    modal.dismiss();
  }

  return result;
};
