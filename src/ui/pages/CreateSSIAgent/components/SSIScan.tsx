import { repeatOutline } from "ionicons/icons";
import { useRef, useState } from "react";
import { i18n } from "../../../../i18n";
import { useAppDispatch } from "../../../../store/hooks";
import { setToastMsg } from "../../../../store/reducers/stateCache";
import { CustomInput } from "../../../components/CustomInput";
import { ErrorMessage } from "../../../components/ErrorMessage";
import { ResponsivePageLayout } from "../../../components/layout/ResponsivePageLayout";
import { OptionModal } from "../../../components/OptionsModal";
import { PageFooter } from "../../../components/PageFooter";
import { PageHeader } from "../../../components/PageHeader";
import { Scan } from "../../../components/Scan";
import { useCameraDirection } from "../../../components/Scan/hook/useCameraDirection";
import { ToastMsgType } from "../../../globals/types";
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

const FOCUS_OUT_TIME = 200;

const SSIScan = ({
  setCurrentPage,
  onScanFinish,
  isLoading,
  isRecovery,
}: SSIScanProps) => {
  const pageId = "ssi-agent-scan";
  const dispatch = useAppDispatch();
  const { cameraDirection, changeCameraDirection, supportMultiCamera } =
    useCameraDirection();
  const [enableCameraDirection, setEnableCameraDirection] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const modalOpen = useRef(false);

  const setOpenModal = (value: boolean) => {
    modalOpen.current = value;
    setOpen(value);
  };

  const [pastedValue, setPastedValue] = useState("");

  const getErrorMessage = () => {
    if (!pastedValue || !isValidHttpUrl(pastedValue))
      return i18n.t("ssiagent.error.invalidurl");
    return "";
  };

  const closeInputManualValue = () => {
    setOpen(false);
    setPastedValue("");
    setTouched(false);
  };

  const handleConfirm = () => {
    if (!pastedValue || !isValidHttpUrl(pastedValue)) return;
    onScanFinish(pastedValue);
  };

  const handleChangeFocus = (value: boolean) => {
    if (!value) {
      setTouched(true);

      setTimeout(() => {
        if (!modalOpen.current) {
          return;
        }

        const message = getErrorMessage();
        if (message) {
          dispatch(setToastMsg(ToastMsgType.URL_ERROR));
        }
      }, FOCUS_OUT_TIME);
    }
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
          primaryButtonAction={() => {
            setOpenModal(true);
          }}
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
        onWillDismiss={closeInputManualValue}
        backdropDismiss
        header={{
          closeButton: true,
          closeButtonAction: closeInputManualValue,
          closeButtonLabel: `${i18n.t("ssiagent.scanssi.scan.modal.cancel")}`,
          title: `${i18n.t("ssiagent.scanssi.scan.modal.title")}`,
          actionButton: true,
          actionButtonDisabled: !pastedValue || !!getErrorMessage(),
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
          error={!!getErrorMessage() && touched}
          className="ssi-input"
          onChangeFocus={handleChangeFocus}
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
