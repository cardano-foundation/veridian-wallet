import { IonIcon } from "@ionic/react";
import { informationCircleOutline } from "ionicons/icons";
import { forwardRef, useImperativeHandle, useState } from "react";
import { useSelector } from "react-redux";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records";
import { AuthService } from "../../../core/agent/services";
import { KeyStoreKeys } from "../../../core/storage";
import { i18n } from "../../../i18n";
import { useAppDispatch } from "../../../store/hooks";
import {
  getStateCache,
  setAuthentication,
} from "../../../store/reducers/stateCache";
import { ToastMsgType } from "../../globals/types";
import { showError } from "../../utils/error";
import {
  errorMessages,
  passwordStrengthChecker,
} from "../../utils/passwordStrengthChecker";
import { combineClassNames } from "../../utils/style";
import { Alert as AlertExisting } from "../Alert";
import { CustomInput } from "../CustomInput";
import { ErrorMessage } from "../ErrorMessage";
import { PageFooter } from "../PageFooter";
import "./PasswordModule.scss";
import { PasswordModuleProps, PasswordModuleRef } from "./PasswordModule.types";
import { PasswordMeter } from "./components/PasswordMeter";
import { SymbolModal } from "./components/SymbolModal";

const PasswordModule = forwardRef<PasswordModuleRef, PasswordModuleProps>(
  ({ title, description, testId, onCreateSuccess }, ref) => {
    const dispatch = useAppDispatch();
    const stateCache = useSelector(getStateCache);
    const authentication = stateCache.authentication;
    const [createPasswordValue, setCreatePasswordValue] = useState("");
    const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
    const [confirmPasswordFocus, setConfirmPasswordFocus] = useState(false);
    const [createPasswordFocus, setCreatePasswordFocus] = useState(false);
    const [hintValue, setHintValue] = useState("");
    const [alertExistingIsOpen, setAlertExistingIsOpen] = useState(false);
    const [isOpenSymbol, setIsOpenSymbol] = useState(false);

    const createPasswordValueMatching =
      createPasswordValue.length > 0 &&
      confirmPasswordValue.length > 0 &&
      createPasswordValue === confirmPasswordValue;
    const createPasswordValueNotMatching =
      createPasswordValue.length > 0 &&
      confirmPasswordValue.length > 0 &&
      createPasswordValue !== confirmPasswordValue;
    const validated =
      passwordStrengthChecker.validatePassword(createPasswordValue) &&
      createPasswordValueMatching &&
      !hintValue.includes(createPasswordValue);

    const handlePasswordInput = (password: string) => {
      setCreatePasswordValue(password);
    };

    const handleClearState = () => {
      setCreatePasswordValue("");
      setConfirmPasswordValue("");
      setHintValue("");
    };

    const handleClearExisting = () => {
      setAlertExistingIsOpen(false);
      handleClearState();
    };

    useImperativeHandle(ref, () => ({
      clearState: handleClearState,
    }));

    const handleContinue = async (skipped: boolean) => {
      if (!skipped) {
        if (authentication.passwordIsSet) {
          try {
            if (
              await Agent.agent.auth.verifySecret(
                KeyStoreKeys.APP_OP_PASSWORD,
                createPasswordValue
              )
            ) {
              setAlertExistingIsOpen(true);
              return;
            }
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.startsWith(AuthService.SECRET_NOT_STORED)
            ) {
              showError(
                "Unable to get current password",
                new Error("Unable to get current password"),
                dispatch
              );
              return;
            }
            throw error;
          }
        }

        await Agent.agent.auth.storeSecret(
          KeyStoreKeys.APP_OP_PASSWORD,
          createPasswordValue
        );

        if (authentication.passwordIsSkipped) {
          await Agent.agent.basicStorage.deleteById(
            MiscRecordId.APP_PASSWORD_SKIPPED
          );
        }

        dispatch(
          setAuthentication({
            ...authentication,
            passwordIsSet: true,
            passwordIsSkipped: false,
          })
        );
        if (hintValue) {
          await Agent.agent.basicStorage.createOrUpdateBasicRecord(
            new BasicRecord({
              id: MiscRecordId.OP_PASS_HINT,
              content: { value: hintValue },
            })
          );
        } else {
          try {
            const previousHint = (
              await Agent.agent.basicStorage.findById(MiscRecordId.OP_PASS_HINT)
            )?.content?.value;

            if (previousHint) {
              await Agent.agent.basicStorage.deleteById(
                MiscRecordId.OP_PASS_HINT
              );
            }
          } catch (e) {
            showError(
              "Unable to delete password hint",
              e,
              dispatch,
              ToastMsgType.UNABLE_DELETE_PASSWORD_HINT
            );
          }
        }
      }

      onCreateSuccess(skipped);
      handleClearState();
    };

    const showPasswordMeter =
      createPasswordValue.length === 0 ||
      createPasswordFocus ||
      !passwordStrengthChecker.validatePassword(createPasswordValue);
    const isInvalidPassword =
      !createPasswordFocus &&
      !!createPasswordValue.length &&
      (!passwordStrengthChecker.validatePassword(createPasswordValue) ||
        !passwordStrengthChecker.isValidCharacters(createPasswordValue));

    const openSymbolModal = () => setIsOpenSymbol(true);

    return (
      <>
        <div className="password-module">
          <form className="page-content">
            {title && <h2 data-testid={`${testId}-title`}>{title}</h2>}
            {description && (
              <p
                className="page-paragraph"
                data-testid={`${testId}-top-paragraph`}
              >
                {description}
              </p>
            )}
            <CustomInput
              labelAction={
                <div
                  className="open-symbol-modal"
                  data-testid="open-symbol-modal"
                  onClick={openSymbolModal}
                >
                  {i18n.t("createpassword.input.first.symbolguide")}
                  <IonIcon icon={informationCircleOutline} />
                </div>
              }
              dataTestId="create-password-input"
              title={`${i18n.t("createpassword.input.first.title")}`}
              placeholder={`${i18n.t(
                "createpassword.input.first.placeholder"
              )}`}
              hiddenInput={true}
              onChangeInput={(password: string) =>
                handlePasswordInput(password)
              }
              onChangeFocus={setCreatePasswordFocus}
              value={createPasswordValue}
              error={isInvalidPassword}
              className={combineClassNames("create-password-input", {
                normal: !isInvalidPassword && !showPasswordMeter,
              })}
            />
            {isInvalidPassword && (
              <ErrorMessage
                message={passwordStrengthChecker.getErrorByPriority(
                  createPasswordValue
                )}
                action={
                  passwordStrengthChecker.getErrorByPriority(
                    createPasswordValue
                  ) === errorMessages.hasNoSymbol && (
                    <span
                      className="learn-more"
                      onClick={openSymbolModal}
                    >
                      {i18n.t("createpassword.learnmore")}
                    </span>
                  )
                }
              />
            )}
            {showPasswordMeter && (
              <PasswordMeter password={createPasswordValue} />
            )}
            <CustomInput
              dataTestId="confirm-password-input"
              title={`${i18n.t("createpassword.input.second.title")}`}
              placeholder={`${i18n.t(
                "createpassword.input.second.placeholder"
              )}`}
              hiddenInput={true}
              onChangeInput={setConfirmPasswordValue}
              onChangeFocus={setConfirmPasswordFocus}
              value={confirmPasswordValue}
              error={
                !confirmPasswordFocus &&
                !!confirmPasswordValue.length &&
                createPasswordValueNotMatching
              }
            />
            {!confirmPasswordFocus &&
              !!confirmPasswordValue.length &&
              createPasswordValueNotMatching && (
              <ErrorMessage
                message={`${i18n.t("createpassword.error.hasNoMatch")}`}
              />
            )}
            <CustomInput
              dataTestId="create-hint-input"
              title={`${i18n.t("createpassword.input.third.title")}`}
              placeholder={`${i18n.t(
                "createpassword.input.third.placeholder"
              )}`}
              onChangeInput={setHintValue}
              optional={true}
              value={hintValue}
              error={
                !!hintValue.length && hintValue.includes(createPasswordValue)
              }
            />
            {!!hintValue.length && hintValue.includes(createPasswordValue) && (
              <ErrorMessage
                message={`${i18n.t("createpassword.error.hintSameAsPassword")}`}
              />
            )}
          </form>
          <PageFooter
            pageId={testId}
            primaryButtonText={`${i18n.t("createpassword.button.continue")}`}
            primaryButtonAction={() => handleContinue(false)}
            primaryButtonDisabled={!validated}
          />
        </div>
        <AlertExisting
          isOpen={alertExistingIsOpen}
          setIsOpen={setAlertExistingIsOpen}
          dataTestId="manage-password-alert-existing"
          headerText={`${i18n.t(
            "tabs.menu.tab.settings.sections.security.managepassword.page.alert.existingpassword"
          )}`}
          confirmButtonText={`${i18n.t(
            "tabs.menu.tab.settings.sections.security.managepassword.page.alert.ok"
          )}`}
          actionConfirm={handleClearExisting}
        />
        <SymbolModal
          isOpen={isOpenSymbol}
          setOpen={setIsOpenSymbol}
        />
      </>
    );
  }
);

export { PasswordModule };
