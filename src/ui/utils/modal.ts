import { modalController } from "@ionic/core";

const BLOCKING_MODALS = ["verify-seedphrase-alert"];

export const dismissAllModals = async (): Promise<boolean> => {
  let modal = await modalController.getTop();

  while (modal) {
    // Check if the current modal is one of the critical blocking screens
    const isBlockingModal = BLOCKING_MODALS.some((className) =>
      modal!.classList.contains(className)
    );

    if (isBlockingModal) {
      // STOP: Do not dismiss, do not redirect.
      return false;
    }

    await modal.dismiss();
    modal = await modalController.getTop();
  }

  return true;
};
