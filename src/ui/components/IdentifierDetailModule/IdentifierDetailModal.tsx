import { IonModal } from "@ionic/react";
import { useCallback, useMemo } from "react";
import { BackEventPriorityType } from "../../globals/types";
import { IdentifierDetailModule } from "./IdentifierDetailModule";
import { IdentifierDetailModalProps } from "./IdentifierDetailModule.types";

const IdentifierDetailModal = ({
  isOpen,
  setIsOpen,
  onClose,
  ...props
}: IdentifierDetailModalProps) => {
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const handleBack = useCallback(() => {
    handleClose();
    onClose?.();
  }, [handleClose, onClose]);

  const hardwareBackButtonConfig = useMemo(
    () => ({
      prevent: false,
      priority: BackEventPriorityType.Modal,
    }),
    []
  );

  return (
    <IonModal
      data-testid={`${props.pageId}-modal`}
      isOpen={isOpen}
      onIonModalDidDismiss={handleClose}
    >
      <IdentifierDetailModule
        {...props}
        onClose={handleBack}
        hardwareBackButtonConfig={hardwareBackButtonConfig}
        navAnimation={false}
        restrictedOptions={true}
      />
    </IonModal>
  );
};

export { IdentifierDetailModal };
export default IdentifierDetailModal;
