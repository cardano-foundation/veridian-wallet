import { alertCircleOutline } from "ionicons/icons";
import { useState } from "react";
import { i18n } from "../../../i18n";
import { Alert } from "../Alert";
import { InfoCard } from "../InfoCard";
import { OptionModal } from "../OptionsModal";
import { PageFooter } from "../PageFooter";
import { Verification } from "../Verification";
import "./RemovePendingAlert.scss";
import { RemovePendingAlertProps } from "./RemovePendingAlert.types";

const RemovePendingAlert = ({
  pageId,
  openFirstCheck,
  secondCheckTitle,
  onClose,
  firstCheckProps,
  onDeletePendingItem,
}: RemovePendingAlertProps) => {
  const alertId = `${pageId}-delete-pending-modal`;
  const [isOpenSecondCheck, setOpenSecondCheck] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);

  const handleConfirm = () => {
    handleCloseSecondCheck();
    setVerifyIsOpen(true);
  };

  const handleCloseSecondCheck = () => {
    setOpenSecondCheck(false);
  };

  const deleteItem = () => {
    setVerifyIsOpen(false);
    onDeletePendingItem();
  };

  const openSecondCheck = () => {
    onClose();
    setOpenSecondCheck(true);
  };

  return (
    <>
      <OptionModal
        modalIsOpen={openFirstCheck}
        customClasses="delete-pending-modal"
        onDismiss={onClose}
        componentId={alertId}
        header={{
          closeButton: true,
          closeButtonLabel: `${i18n.t("removependingalert.button.done")}`,
          closeButtonAction: onClose,
          title: firstCheckProps.title,
        }}
      >
        <InfoCard
          className="user-tips"
          icon={alertCircleOutline}
          content={firstCheckProps.description}
        />
        <PageFooter
          pageId={alertId}
          deleteButtonText={firstCheckProps.button}
          deleteButtonAction={openSecondCheck}
        />
      </OptionModal>
      <Alert
        isOpen={isOpenSecondCheck}
        setIsOpen={setOpenSecondCheck}
        dataTestId={alertId}
        headerText={secondCheckTitle}
        confirmButtonText={`${i18n.t("removependingalert.button.confirm")}`}
        cancelButtonText={`${i18n.t("removependingalert.button.cancel")}`}
        actionConfirm={handleConfirm}
        actionCancel={handleCloseSecondCheck}
        actionDismiss={handleCloseSecondCheck}
      />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={deleteItem}
      />
    </>
  );
};

export { RemovePendingAlert };
