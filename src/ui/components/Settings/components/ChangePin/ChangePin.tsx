import { IonModal } from "@ionic/react";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { i18n } from "../../../../../i18n";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { ToastMsgType } from "../../../../globals/types";
import { CreatePasscodeModule } from "../../../CreatePasscodeModule";
import { ResponsivePageLayout } from "../../../layout/ResponsivePageLayout";
import { PageHeader } from "../../../PageHeader";
import "./ChangePin.scss";
import { ChangePinModalProps, ChangePinModuleRef } from "./ChangePin.types";

const ChangePin = ({ isOpen, setIsOpen }: ChangePinModalProps) => {
  const pageId = "change-pin";
  const dispatch = useDispatch();
  const [passCodeValue, setPassCodeValue] = useState({
    passcode: "",
    originalPasscode: "",
  });

  const ref = useRef<ChangePinModuleRef>(null);

  const handlePassAuth = async () => {
    dispatch(setToastMsg(ToastMsgType.PASSCODE_UPDATED));
    setIsOpen(false);
  };

  const handleCancel = () => {
    passCodeValue.originalPasscode.length === 0 && setIsOpen(false);
    ref.current?.clearState();
  };

  const title =
    passCodeValue.originalPasscode.length === 0
      ? i18n.t("settings.sections.security.changepin.createpasscode")
      : i18n.t("settings.sections.security.changepin.reenterpasscode");

  return (
    <IonModal
      isOpen={isOpen}
      className={pageId + "-modal"}
      data-testid={pageId + "-modal"}
      onDidDismiss={() => setIsOpen(false)}
    >
      {isOpen && (
        <ResponsivePageLayout
          pageId={pageId}
          header={
            <PageHeader
              closeButton={true}
              closeButtonLabel={`${
                passCodeValue.originalPasscode.length === 6
                  ? i18n.t("settings.sections.security.changepin.back")
                  : i18n.t("settings.sections.security.changepin.cancel")
              }`}
              closeButtonAction={handleCancel}
            />
          }
        >
          <CreatePasscodeModule
            title={title}
            description={`${i18n.t(
              "settings.sections.security.changepin.description"
            )}`}
            ref={ref}
            testId={pageId}
            changePasscodeMode
            onCreateSuccess={handlePassAuth}
            onPasscodeChange={(passcode, originalPasscode) => {
              setPassCodeValue({
                passcode,
                originalPasscode,
              });
            }}
          />
        </ResponsivePageLayout>
      )}
    </IonModal>
  );
};

export { ChangePin };
