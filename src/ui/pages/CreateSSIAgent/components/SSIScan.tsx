import { repeatOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { i18n } from "../../../../i18n";
import { CustomInput } from "../../../components/CustomInput";
import { ErrorMessage } from "../../../components/ErrorMessage";
import { ResponsivePageLayout } from "../../../components/layout/ResponsivePageLayout";
import { OptionModal } from "../../../components/OptionsModal";
import { PageFooter } from "../../../components/PageFooter";
import { PageHeader } from "../../../components/PageHeader";
import { Scan } from "../../../components/Scan";
import { useCameraDirection } from "../../../components/Scan/hook/useCameraDirection";
import { combineClassNames } from "../../../utils/style";
import { isValidHttpUrl } from "../../../utils/urlChecker";
import { CurrentPage, SSIScanProps } from "../CreateSSIAgent.types";

const InputError = ({
  showError,
  errorMessage,
}: {
  showError: boolean;
  errorMessage: string;
}) => {
  return showError ? (
    <ErrorMessage message={errorMessage} />
  ) : (
    <div className="ssi-error-placeholder" />
  );
};

const SSIScan = ({
  setCurrentPage,
  onScanFinish,
  isLoading,
  isRecovery,
}: SSIScanProps) => {
  const pageId = "ssi-agent-scan";
  const { cameraDirection, changeCameraDirection, supportMultiCamera } =
    useCameraDirection();
  const [enableCameraDirection, setEnableCameraDirection] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    return () => {
      setOpen(false);
    };
  }, []);
  const [pastedValue, setPastedValue] = useState("");

  const getErrorMessage = () => {
    if (!pastedValue || !isValidHttpUrl(pastedValue))
      return i18n.t("ssiagent.error.invalidurl");
    return "";
  };

  const closeInputManualValue = () => {
    setOpen(false);
    setPastedValue("");
  };

  const handleConfirm = () => {
    if (!pastedValue || !isValidHttpUrl(pastedValue)) return;
    onScanFinish(pastedValue);
  };

  return (
    <>
      <ResponsivePageLayout
        pageId={pageId}
        activeStatus={true}
        header={
          <PageHeader
            closeButton
            closeButtonLabel={`${i18n.t("ssiagent.scanssi.cancel")}`}
            closeButtonAction={() => setCurrentPage(CurrentPage.Connect)}
            actionButton={supportMultiCamera}
            actionButtonIcon={repeatOutline}
            actionButtonAction={changeCameraDirection}
            actionButtonDisabled={!enableCameraDirection}
          />
        }
      >
        <div className="placeholder"></div>
        <Scan
          onFinishScan={onScanFinish}
          cameraDirection={cameraDirection}
          onCheckPermissionFinish={setEnableCameraDirection}
          hiddenDefaultPasteValueButton
        />
        <PageFooter
          primaryButtonAction={() => setOpen(true)}
          primaryButtonText={`${i18n.t(
            "ssiagent.scanssi.scan.button.entermanual"
          )}`}
          tertiaryButtonAction={() =>
            setCurrentPage(CurrentPage.AdvancedSetting)
          }
          tertiaryButtonText={
            isRecovery
              ? undefined
              : `${i18n.t("ssiagent.scanssi.scan.button.advancedsetup")}`
          }
        />
      </ResponsivePageLayout>
      <OptionModal
        modalIsOpen={isOpen}
        componentId={pageId + "-input-modal"}
        customClasses={combineClassNames(
          pageId + "-input-modal",
          isLoading ? "loading" : undefined
        )}
        onDismiss={closeInputManualValue}
        header={{
          closeButton: true,
          closeButtonAction: closeInputManualValue,
          closeButtonLabel: `${i18n.t("ssiagent.scanssi.scan.modal.cancel")}`,
          title: `${i18n.t("ssiagent.scanssi.scan.modal.title")}`,
          actionButton: true,
          actionButtonDisabled: !pastedValue,
          actionButtonAction: handleConfirm,
          actionButtonLabel: `${i18n.t("ssiagent.scanssi.scan.modal.confirm")}`,
        }}
      >
        <CustomInput
          dataTestId={`${pageId}-input`}
          autofocus={true}
          onChangeInput={setPastedValue}
          value={pastedValue}
          placeholder={`${i18n.t("ssiagent.scanssi.scan.modal.placeholder")}`}
          onChangeFocus={(value) => !value && setTouched(true)}
        />
        <InputError
          showError={!!getErrorMessage() && touched}
          errorMessage={getErrorMessage()}
        />
      </OptionModal>
    </>
  );
};

export { SSIScan };
