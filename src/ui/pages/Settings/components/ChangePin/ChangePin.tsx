import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { i18n } from "../../../../../i18n";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { ToastMsgType } from "../../../../globals/types";
import { CreatePasscodeModule } from "../../../../components/CreatePasscodeModule";
import { ResponsivePageLayout } from "../../../../components/layout/ResponsivePageLayout";
import { PageHeader } from "../../../../components/PageHeader";
import "./ChangePin.scss";
import { ChangePinProps, ChangePinModuleRef } from "./ChangePin.types";

const ChangePin = ({
  changePinStep,
  setChangePinStep,
  handleClose,
}: ChangePinProps) => {
  const pageId = "change-pin";
  const dispatch = useDispatch();
  const [passCodeValue, setPassCodeValue] = useState({
    passcode: "",
    originalPasscode: "",
  });

  const ref = useRef<ChangePinModuleRef>(null);

  const handlePassAuth = async () => {
    dispatch(setToastMsg(ToastMsgType.PASSCODE_UPDATED));
    handleClose();
    setChangePinStep(0);
  };

  const handleCancel = () => {
    passCodeValue.originalPasscode.length === 0 && handleClose();
    setChangePinStep(0);
    ref.current?.clearState();
  };

  useEffect(() => {
    if (passCodeValue.originalPasscode.length === 6) {
      setChangePinStep(1);
    }
  }, [passCodeValue.originalPasscode.length]);

  return (
    <>
      <CreatePasscodeModule
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
      {/* <ResponsivePageLayout
        pageId={pageId}
        header={
          <PageHeader
            closeButton={true}
            closeButtonLabel={`${
              changePinStep === 1
                ? i18n.t("settings.sections.security.changepin.back")
                : i18n.t("settings.sections.security.changepin.cancel")
            }`}
            closeButtonAction={handleCancel}
          />
        }
      >
        
      </ResponsivePageLayout> */}
    </>
  );
};

export { ChangePin };
