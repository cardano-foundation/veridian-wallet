import { IonModal } from "@ionic/react";
import "./ResponsiveModal.scss";
import { ResponsiveModalProps } from "./ResponsiveModal.types";

const ResponsiveModal = ({
  componentId,
  modalIsOpen,
  customClasses,
  children,
  backdropDismiss,
  onDismiss,
  onWillDismiss,
}: ResponsiveModalProps) => {
  return (
    <IonModal
      isOpen={modalIsOpen}
      breakpoints={[0, 1]}
      initialBreakpoint={1}
      data-testid={componentId}
      className={`responsive-modal ${customClasses}`}
      onDidDismiss={onDismiss}
      backdropDismiss={backdropDismiss}
      onWillDismiss={onWillDismiss}
    >
      <div className={`responsive-modal-content ${componentId}-content`}>
        {children}
      </div>
    </IonModal>
  );
};

export { ResponsiveModal };
