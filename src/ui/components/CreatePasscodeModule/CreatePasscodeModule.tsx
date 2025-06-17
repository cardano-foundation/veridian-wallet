import { BiometryErrorType } from "@aparajita/capacitor-biometric-auth";
import { BiometryError } from "@aparajita/capacitor-biometric-auth/dist/esm/definitions";
import { getPlatforms } from "@ionic/react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records";
import { i18n } from "../../../i18n";
import { useAppDispatch } from "../../../store/hooks";
import { setEnableBiometricsCache } from "../../../store/reducers/biometricsCache";
import { setToastMsg } from "../../../store/reducers/stateCache";
import { ToastMsgType } from "../../globals/types";
import { useBiometricAuth } from "../../hooks/useBiometricsHook";
import { Alert } from "../Alert";
import { ErrorMessage, MESSAGE_MILLISECONDS } from "../ErrorMessage";
import { PageFooter } from "../PageFooter";
import { PasscodeModule } from "../PasscodeModule";
import "./CreatePasscodeModule.scss";
import {
  CreatePasscodeModuleProps,
  CreatePasscodeModuleRef,
} from "./CreatePasscodeModule.types";
import { showError } from "../../utils/error";
import { KeyStoreKeys } from "../../../core/storage";
import { AuthService } from "../../../core/agent/services";
import {
  isConsecutive,
  isRepeat,
  isReverseConsecutive,
} from "../../utils/passcodeChecker";
import { usePrivacyScreen } from "../../hooks/privacyScreenHook";

const CreatePasscodeModule = forwardRef<
  CreatePasscodeModuleRef,
  CreatePasscodeModuleProps
>(
  (
    {
      testId,
      title,
      description,
      overrideAlertZIndex,
      changePasscodeMode,
      onCreateSuccess,
      onPasscodeChange,
    },
    ref
  ) => {
    const dispatch = useAppDispatch();
    const [passcode, setPasscode] = useState("");
    const [passcodeMatch, setPasscodeMatch] = useState(false);
    const [showSetupBiometricsAlert, setShowSetupBiometricsAlert] =
      useState(false);
    const [showCancelBiometricsAlert, setShowCancelBiometricsAlert] =
      useState(false);
    const [originalPassCode, setOriginalPassCode] = useState("");
    const { enablePrivacy, disablePrivacy } = usePrivacyScreen();
    const { handleBiometricAuth, biometricInfo } = useBiometricAuth();

    const setupBiometricsHeaderText = i18n.t("biometry.setupbiometryheader");

    const setupBiometricsConfirmtext = i18n.t("biometry.setupbiometryconfirm");
    const setupBiometricsCanceltext = i18n.t("biometry.setupbiometrycancel");

    const alertClasses = overrideAlertZIndex ? "max-zindex" : undefined;
    const cancelBiometricsHeaderText = i18n.t("biometry.cancelbiometryheader");
    const cancelBiometricsConfirmText = setupBiometricsConfirmtext;

    useEffect(() => {
      if (passcodeMatch) {
        setTimeout(() => {
          setPasscodeMatch(false);
        }, MESSAGE_MILLISECONDS);
      }
    }, [passcodeMatch]);

    const handlePinChange = async (digit: number) => {
      if (passcode.length < 6) {
        setPasscode(passcode + digit);
        if (originalPassCode !== "" && passcode.length === 5) {
          if (originalPassCode === passcode + digit) {
            if (
              biometricInfo?.strongBiometryIsAvailable &&
              !changePasscodeMode
            ) {
              setShowSetupBiometricsAlert(true);
            } else {
              await handlePassAuth();
            }
          }
        }
      }
    };

    const processBiometrics = async () => {
      let isBiometricAuthenticated: boolean | BiometryError = false;
      try {
        await disablePrivacy();
        isBiometricAuthenticated = await handleBiometricAuth();
      } finally {
        await enablePrivacy();
      }

      if (isBiometricAuthenticated === true) {
        await Agent.agent.basicStorage.createOrUpdateBasicRecord(
          new BasicRecord({
            id: MiscRecordId.APP_BIOMETRY,
            content: { enabled: true },
          })
        );
        dispatch(setEnableBiometricsCache(true));
        dispatch(
          setToastMsg(ToastMsgType.SETUP_BIOMETRIC_AUTHENTICATION_SUCCESS)
        );
        await handlePassAuth();
      } else if (isBiometricAuthenticated instanceof BiometryError) {
        if (
          isBiometricAuthenticated.code === BiometryErrorType.userCancel ||
          isBiometricAuthenticated.code ===
            BiometryErrorType.biometryNotAvailable
        ) {
          setShowCancelBiometricsAlert(true);
        }
      }
    };

    const handlePassAuth = async () => {
      try {
        await Agent.agent.auth.storeSecret(
          KeyStoreKeys.APP_PASSCODE,
          originalPassCode
        );
        onCreateSuccess();
      } catch (e) {
        showError("Unable to save app passcode", e, dispatch);
      }
    };

    const handleSetupAndroidBiometrics = async () => {
      await processBiometrics();
    };

    const handleCancelSetupAndroidBiometrics = async () => {
      setShowCancelBiometricsAlert(true);
    };

    const handleCancelBiometrics = async () => {
      await handlePassAuth();
    };

    const handleRemove = () => {
      if (passcode.length >= 1) {
        setPasscode(passcode.substring(0, passcode.length - 1));
      }
    };

    const handleClearState = () => {
      setPasscode("");
      setOriginalPassCode("");
      setShowCancelBiometricsAlert(false);
      setShowSetupBiometricsAlert(false);
    };

    useImperativeHandle(ref, () => ({
      clearState: handleClearState,
    }));

    useEffect(() => {
      if (
        passcode.length === 6 &&
        (isRepeat(passcode) ||
          isConsecutive(passcode) ||
          isReverseConsecutive(passcode))
      ) {
        return;
      }

      onPasscodeChange?.(passcode, originalPassCode);

      if (passcode.length === 6 && originalPassCode === "") {
        Agent.agent.auth
          .verifySecret(KeyStoreKeys.APP_PASSCODE, passcode)
          .then((match) => {
            if (match) {
              setPasscodeMatch(true);
              setTimeout(() => {
                setPasscode("");
              }, MESSAGE_MILLISECONDS);
            } else {
              setOriginalPassCode(passcode);
              setPasscode("");
            }
          })
          .catch((error) => {
            if (
              !(
                error instanceof Error &&
                error.message.startsWith(AuthService.SECRET_NOT_STORED)
              )
            ) {
              throw error;
            }
            setOriginalPassCode(passcode);
            setPasscode("");
          });
      }
    }, [originalPassCode, passcode]);

    const errorMessage = () => {
      const resetPasscode = () => {
        setTimeout(() => {
          setPasscode("");
        }, MESSAGE_MILLISECONDS);
      };

      const getErrorMessage = () => {
        if (passcodeMatch) {
          return i18n.t("createpasscodemodule.errormatch");
        }

        if (passcode.length === 6) {
          if (isRepeat(passcode)) {
            return i18n.t("createpasscodemodule.repeat");
          }

          if (isConsecutive(passcode) || isReverseConsecutive(passcode)) {
            return i18n.t("createpasscodemodule.consecutive");
          }
        }

        if (originalPassCode !== "" && passcode.length === 6) {
          if (originalPassCode !== passcode) {
            return i18n.t("createpasscodemodule.errornomatch");
          }
        }

        return undefined;
      };

      const errorMessage = getErrorMessage();
      if (errorMessage) {
        resetPasscode();
      }

      return errorMessage;
    };

    return (
      <div className="create-passcode-module">
        {title && (
          <h2
            className="set-passcode-title"
            data-testid={`${testId}-title`}
          >
            {title}
          </h2>
        )}
        {description && (
          <p
            className="set-passcode-description small-hide"
            data-testid="set-passcode-description"
          >
            {description}
          </p>
        )}
        <PasscodeModule
          error={
            <ErrorMessage
              message={errorMessage()}
              timeout={true}
            />
          }
          hasError={!!errorMessage()}
          passcode={passcode}
          handlePinChange={handlePinChange}
          handleRemove={handleRemove}
        />
        <PageFooter
          pageId={testId}
          customClass={originalPassCode === "" ? "hide " : ""}
          secondaryButtonText={`${i18n.t("createpasscodemodule.cantremember")}`}
          secondaryButtonAction={() => handleClearState()}
        />
        <Alert
          isOpen={showSetupBiometricsAlert}
          setIsOpen={setShowSetupBiometricsAlert}
          dataTestId="alert-setup-biometry"
          headerText={setupBiometricsHeaderText}
          confirmButtonText={setupBiometricsConfirmtext}
          cancelButtonText={setupBiometricsCanceltext}
          actionConfirm={handleSetupAndroidBiometrics}
          actionCancel={handleCancelSetupAndroidBiometrics}
          backdropDismiss={false}
          className={alertClasses}
        />
        <Alert
          isOpen={showCancelBiometricsAlert}
          setIsOpen={setShowCancelBiometricsAlert}
          dataTestId="alert-cancel-biometry"
          headerText={cancelBiometricsHeaderText}
          confirmButtonText={cancelBiometricsConfirmText}
          actionConfirm={handleCancelBiometrics}
          backdropDismiss={false}
          className={alertClasses}
        />
      </div>
    );
  }
);

export { CreatePasscodeModule };
