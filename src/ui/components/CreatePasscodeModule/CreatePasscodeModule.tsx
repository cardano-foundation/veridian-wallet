import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { AuthService } from "../../../core/agent/services";
import { KeyStoreKeys } from "../../../core/storage";
import { i18n } from "../../../i18n";
import { useAppDispatch } from "../../../store/hooks";
import { showError } from "../../utils/error";
import {
  isConsecutive,
  isRepeat,
  isReverseConsecutive,
} from "../../utils/passcodeChecker";
import { ErrorMessage, MESSAGE_MILLISECONDS } from "../ErrorMessage";
import { PageFooter } from "../PageFooter";
import { PasscodeModule } from "../PasscodeModule";
import "./CreatePasscodeModule.scss";
import {
  CreatePasscodeModuleProps,
  CreatePasscodeModuleRef,
} from "./CreatePasscodeModule.types";

const CreatePasscodeModule = forwardRef<
  CreatePasscodeModuleRef,
  CreatePasscodeModuleProps
>(({ testId, title, description, onCreateSuccess, onPasscodeChange }, ref) => {
  const dispatch = useAppDispatch();
  const [passcode, setPasscode] = useState("");
  const [passcodeMatch, setPasscodeMatch] = useState(false);
  const [originalPassCode, setOriginalPassCode] = useState("");

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
          await handlePassAuth();
        }
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
      showError(i18n.t("createpasscodemodule.saveFailed"), e, dispatch);
    }
  };

  const handleRemove = () => {
    if (passcode.length >= 1) {
      setPasscode(passcode.substring(0, passcode.length - 1));
    }
  };

  const handleClearState = () => {
    setPasscode("");
    setOriginalPassCode("");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        tertiaryButtonText={`${i18n.t("createpasscodemodule.cantremember")}`}
        tertiaryButtonAction={() => handleClearState()}
      />
    </div>
  );
});

export { CreatePasscodeModule };
