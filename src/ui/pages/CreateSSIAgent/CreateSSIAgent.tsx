import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import {
  addOutline,
  informationCircleOutline,
  openOutline,
  refreshOutline,
  scanOutline,
} from "ionicons/icons";
import { MouseEvent as ReactMouseEvent, useEffect, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records";
import { ConfigurationService } from "../../../core/configuration";
import { IndividualOnlyMode } from "../../../core/configuration/configurationService.types";
import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { getNextRoute } from "../../../routes/nextRoute";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setIndividualFirstCreate } from "../../../store/reducers/identifiersCache";
import { getSeedPhraseCache } from "../../../store/reducers/seedPhraseCache";
import {
  clearSSIAgent,
  getSSIAgent,
  setBootUrl,
  setConnectUrl,
} from "../../../store/reducers/ssiAgent";
import {
  getStateCache,
  setCurrentOperation,
  setRecoveryCompleteNoInterruption,
  setShowWelcomePage,
} from "../../../store/reducers/stateCache";
import { updateReduxState } from "../../../store/utils";
import { CustomInput } from "../../components/CustomInput";
import { ErrorMessage } from "../../components/ErrorMessage";
import { PageFooter } from "../../components/PageFooter";
import { PageHeader } from "../../components/PageHeader";
import { SwitchOnboardingModeModal } from "../../components/SwitchOnboardingModeModal";
import { OnboardingMode } from "../../components/SwitchOnboardingModeModal/SwitchOnboardingModeModal.types";
import { TermsModal } from "../../components/TermsModal";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import {
  ONBOARDING_DOCUMENTATION_LINK,
  RECOVERY_DOCUMENTATION_LINK,
} from "../../globals/constants";
import { OperationType, ToastMsgType } from "../../globals/types";
import { useAppIonRouter } from "../../hooks";
import { showError } from "../../utils/error";
import { openBrowserLink } from "../../utils/openBrowserLink";
import { isValidHttpUrl } from "../../utils/urlChecker";
import "./CreateSSIAgent.scss";
import { NotificationRoute } from "../../../core/agent/services/keriaNotificationService.types";
import { addNotification } from "../../../store/reducers/notificationsCache";

const SSI_URLS_EMPTY = "SSI url is empty";
const SEED_PHRASE_EMPTY = "Invalid seed phrase";

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

const CreateSSIAgent = () => {
  const pageId = "create-ssi-agent";
  const ssiAgent = useAppSelector(getSSIAgent);
  const seedPhraseCache = useAppSelector(getSeedPhraseCache);
  const stateCache = useAppSelector(getStateCache);

  const ionRouter = useAppIonRouter();
  const dispatch = useAppDispatch();
  const [connectUrlInputTouched, setConnectUrlTouched] = useState(false);
  const [bootUrlInputTouched, setBootUrlInputTouched] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMismatchError, setHasMismatchError] = useState(false);
  const [unknownError, setUnknownError] = useState(false);
  const [isInvalidBootUrl, setIsInvalidBootUrl] = useState(false);
  const [isInvalidConnectUrl, setInvalidConnectUrl] = useState(false);
  const [showSwitchModeModal, setSwitchModeModal] = useState(false);

  const isRecoveryMode = stateCache.authentication.recoveryWalletProgress;
  const isIndividualOnlyFirstCreateMode =
    ConfigurationService.env.features.customise?.identifiers?.creation
      ?.individualOnly === IndividualOnlyMode.FirstTime;

  useEffect(() => {
    if (!ssiAgent.bootUrl && !ssiAgent.connectUrl) {
      dispatch(
        setConnectUrl(ConfigurationService.env?.keri?.keria?.url || undefined)
      );
      dispatch(
        setBootUrl(ConfigurationService.env?.keri?.keria?.bootUrl || undefined)
      );
    }
  }, [dispatch, ssiAgent.bootUrl, ssiAgent.connectUrl]);

  const setTouchedConnectUrlInput = () => {
    setConnectUrlTouched(true);
  };

  const setTouchedBootUrlInput = () => {
    setBootUrlInputTouched(true);
  };

  const validBootUrl =
    isRecoveryMode || (ssiAgent.bootUrl && isValidHttpUrl(ssiAgent.bootUrl));

  const validConnectUrl =
    ssiAgent.connectUrl && isValidHttpUrl(ssiAgent.connectUrl);

  const displayBootUrlError =
    !isRecoveryMode &&
    bootUrlInputTouched &&
    ssiAgent.bootUrl &&
    !isValidHttpUrl(ssiAgent.bootUrl);

  const displayConnectUrlError =
    connectUrlInputTouched &&
    ssiAgent.connectUrl &&
    !isValidHttpUrl(ssiAgent.connectUrl);

  const validated = validBootUrl && validConnectUrl;

  const handleClearState = () => {
    dispatch(clearSSIAgent());
  };

  const handleError = (error: Error) => {
    const errorMessage = error.message;

    if (Agent.KERIA_BOOT_FAILED === errorMessage) {
      setIsInvalidBootUrl(true);
    }

    if (Agent.KERIA_NOT_BOOTED === errorMessage) {
      setHasMismatchError(true);
    }

    if (Agent.KERIA_BOOTED_ALREADY_BUT_CANNOT_CONNECT === errorMessage) {
      setInvalidConnectUrl(true);
    }

    if (
      [
        Agent.KERIA_BOOT_FAILED_BAD_NETWORK,
        Agent.KERIA_CONNECT_FAILED_BAD_NETWORK,
      ].includes(errorMessage)
    ) {
      setUnknownError(true);
      showError("Bad network", error);
      return;
    }

    showError(
      "Unable to boot or connect keria",
      error,
      dispatch,
      ToastMsgType.UNKNOWN_ERROR
    );
  };

  const updateFirstInstallValue = async (firstInstall: boolean) => {
    try {
      if (firstInstall) {
        if (
          ConfigurationService.env.features.customise?.notifications
            ?.connectInstructions
        ) {
          const connectNotification =
            await Agent.agent.keriaNotifications.createSingletonNotification(
              NotificationRoute.LocalSingletonConnectInstructions,
              {
                name: ConfigurationService.env.features.customise?.notifications
                  .connectInstructions.connectionName,
              }
            );

          if (connectNotification) {
            dispatch(addNotification(connectNotification));
          }
        }

        await Agent.agent.basicStorage.createOrUpdateBasicRecord(
          new BasicRecord({
            id: MiscRecordId.APP_FIRST_INSTALL,
            content: {
              value: firstInstall,
            },
          })
        );
      } else {
        await Agent.agent.basicStorage.deleteById(
          MiscRecordId.APP_FIRST_INSTALL
        );
      }
      dispatch(setShowWelcomePage(firstInstall));
    } catch (e) {
      showError("Unable to set first app launch", e);
    }
  };

  const handleRecoveryWallet = async () => {
    setLoading(true);
    try {
      if (!ssiAgent.connectUrl) {
        throw new Error(SSI_URLS_EMPTY);
      }

      if (!seedPhraseCache.seedPhrase) {
        throw new Error(SEED_PHRASE_EMPTY);
      }

      const connectUrl = removeLastSlash(ssiAgent.connectUrl.trim());

      dispatch(setConnectUrl(connectUrl));

      await Agent.agent.recoverKeriaAgent(
        seedPhraseCache.seedPhrase.split(" "),
        connectUrl
      );

      dispatch(setRecoveryCompleteNoInterruption());

      await updateFirstInstallValue(false);

      const { nextPath, updateRedux } = getNextRoute(RoutePath.SSI_AGENT, {
        store: { stateCache },
      });

      updateReduxState(
        nextPath.pathname,
        {
          store: { stateCache },
        },
        dispatch,
        updateRedux
      );

      Agent.agent.basicStorage.deleteById(MiscRecordId.APP_RECOVERY_WALLET);

      ionRouter.push(nextPath.pathname, "forward", "push");
      handleClearState();
    } catch (e) {
      const errorMessage = (e as Error).message;

      if (
        [SSI_URLS_EMPTY, SEED_PHRASE_EMPTY, Agent.INVALID_MNEMONIC].includes(
          errorMessage
        )
      ) {
        return;
      }

      handleError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSSI = async () => {
    setLoading(true);
    try {
      if (!ssiAgent.bootUrl || !ssiAgent.connectUrl) {
        throw new Error(SSI_URLS_EMPTY);
      }

      const bootUrl = removeLastSlash(ssiAgent.bootUrl.trim());
      const connectUrl = removeLastSlash(ssiAgent.connectUrl.trim());

      dispatch(setBootUrl(bootUrl));
      dispatch(setConnectUrl(connectUrl));

      await Agent.agent.bootAndConnect({
        bootUrl: bootUrl,
        url: connectUrl,
      });

      await updateFirstInstallValue(true);

      if (isIndividualOnlyFirstCreateMode) {
        await Agent.agent.basicStorage
          .createOrUpdateBasicRecord(
            new BasicRecord({
              id: MiscRecordId.INDIVIDUAL_FIRST_CREATE,
              content: { value: true },
            })
          )
          .then(() =>
            dispatch(setIndividualFirstCreate(isIndividualOnlyFirstCreateMode))
          );
      }

      const { nextPath, updateRedux } = getNextRoute(RoutePath.SSI_AGENT, {
        store: { stateCache },
      });

      updateReduxState(
        nextPath.pathname,
        {
          store: { stateCache },
        },
        dispatch,
        updateRedux
      );

      ionRouter.push(nextPath.pathname, "forward", "push");
      handleClearState();
    } catch (e) {
      handleError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = () => {
    if (isRecoveryMode) {
      handleRecoveryWallet();
    } else {
      handleCreateSSI();
    }
  };

  const scanBootUrl = (event: ReactMouseEvent<HTMLElement, MouseEvent>) => {
    event.stopPropagation();
    dispatch(setCurrentOperation(OperationType.SCAN_SSI_BOOT_URL));
    setTouchedBootUrlInput();
  };

  const scanConnectUrl = (event: ReactMouseEvent<HTMLElement, MouseEvent>) => {
    event.stopPropagation();
    dispatch(setCurrentOperation(OperationType.SCAN_SSI_CONNECT_URL));
    setTouchedConnectUrlInput();
  };

  const removeLastSlash = (url: string) => {
    let result = url;

    while (result && result.length > 0 && url[result.length - 1] === "/") {
      result = result.substring(0, result.length - 1);
    }

    return result;
  };

  const handleChangeConnectUrl = (connectionUrl: string) => {
    setInvalidConnectUrl(false);
    setHasMismatchError(false);
    setUnknownError(false);
    dispatch(setConnectUrl(connectionUrl));
  };

  const handleChangeBootUrl = (bootUrl: string) => {
    setIsInvalidBootUrl(false);
    dispatch(setBootUrl(bootUrl));
  };

  const handleOpenUrl = () => {
    openBrowserLink(
      isRecoveryMode
        ? RECOVERY_DOCUMENTATION_LINK
        : ONBOARDING_DOCUMENTATION_LINK
    );
  };

  const mode = isRecoveryMode ? OnboardingMode.Create : OnboardingMode.Recovery;

  const buttonLabel = !isRecoveryMode
    ? i18n.t("generateseedphrase.onboarding.button.switch")
    : i18n.t("verifyrecoveryseedphrase.button.switch");

  const showConnectionUrlError =
    !!displayConnectUrlError ||
    hasMismatchError ||
    isInvalidConnectUrl ||
    unknownError;

  const connectionUrlError = (() => {
    if (unknownError) {
      return "ssiagent.error.unknownissue";
    }

    if (hasMismatchError) {
      if (isRecoveryMode) {
        return "ssiagent.error.recoverymismatchconnecturl";
      }
      return "ssiagent.error.mismatchconnecturl";
    }

    if (displayBootUrlError && !isInvalidConnectUrl) {
      return "ssiagent.error.invalidurl";
    }

    return "ssiagent.error.invalidconnecturl";
  })();

  return (
    <>
      <ScrollablePageLayout
        pageId={pageId}
        header={
          <PageHeader
            currentPath={RoutePath.SSI_AGENT}
            progressBar={true}
            progressBarValue={1}
            progressBarBuffer={1}
          />
        }
      >
        <div className="content-container ">
          <div>
            <h2
              className="title"
              data-testid={`${pageId}-title`}
            >
              {i18n.t("ssiagent.title")}
            </h2>
            <p
              className="page-paragraph"
              data-testid={`${pageId}-top-paragraph`}
            >
              {i18n.t(
                isRecoveryMode
                  ? "ssiagent.verifydescription"
                  : "ssiagent.description"
              )}
            </p>
            <div>
              <IonButton
                fill="outline"
                className="copy-button secondary-button"
                onClick={() => setOpenInfo(true)}
              >
                <IonIcon
                  slot="start"
                  icon={informationCircleOutline}
                />
                {i18n.t("ssiagent.button.info")}
              </IonButton>
            </div>
            {!isRecoveryMode && (
              <>
                <CustomInput
                  className="boot-url-input"
                  dataTestId="boot-url-input"
                  title={`${i18n.t("ssiagent.input.boot.label")}`}
                  placeholder={`${i18n.t("ssiagent.input.boot.placeholder")}`}
                  actionIcon={scanOutline}
                  action={scanBootUrl}
                  onChangeInput={handleChangeBootUrl}
                  value={ssiAgent.bootUrl || ""}
                  onChangeFocus={(result) => {
                    setTouchedBootUrlInput();

                    if (!result && ssiAgent.bootUrl) {
                      dispatch(
                        setBootUrl(removeLastSlash(ssiAgent.bootUrl.trim()))
                      );
                    }
                  }}
                  error={!!displayBootUrlError || isInvalidBootUrl}
                />
                <InputError
                  showError={!!displayBootUrlError || isInvalidBootUrl}
                  errorMessage={
                    (displayBootUrlError || isInvalidBootUrl) &&
                    !displayConnectUrlError
                      ? `${i18n.t("ssiagent.error.invalidbooturl")}`
                      : `${i18n.t("ssiagent.error.invalidurl")}`
                  }
                />
              </>
            )}
            <CustomInput
              className="connect-url-input"
              dataTestId="connect-url-input"
              title={`${i18n.t("ssiagent.input.connect.label")}`}
              placeholder={`${i18n.t("ssiagent.input.connect.placeholder")}`}
              actionIcon={scanOutline}
              action={scanConnectUrl}
              onChangeInput={handleChangeConnectUrl}
              onChangeFocus={(result) => {
                setTouchedConnectUrlInput();

                if (!result && ssiAgent.connectUrl) {
                  dispatch(
                    setConnectUrl(removeLastSlash(ssiAgent.connectUrl.trim()))
                  );
                }
              }}
              value={ssiAgent.connectUrl || ""}
              error={showConnectionUrlError}
            />
            <InputError
              showError={showConnectionUrlError}
              errorMessage={`${i18n.t(connectionUrlError)}`}
            />
          </div>
          <PageFooter
            pageId={pageId}
            primaryButtonText={`${i18n.t("ssiagent.button.validate")}`}
            primaryButtonAction={() => handleValidate()}
            primaryButtonDisabled={!validated || loading}
            tertiaryButtonText={buttonLabel}
            tertiaryButtonAction={() => setSwitchModeModal(true)}
            tertiaryButtonIcon={isRecoveryMode ? addOutline : refreshOutline}
          />
        </div>
      </ScrollablePageLayout>
      {loading && (
        <div
          className="ssi-spinner-container"
          data-testid="ssi-spinner-container"
        >
          <IonSpinner name="circular" />
        </div>
      )}
      <TermsModal
        name={`about-ssi-agent-${
          isRecoveryMode ? OnboardingMode.Recovery : OnboardingMode.Create
        }`}
        isOpen={openInfo}
        setIsOpen={setOpenInfo}
      >
        <IonButton
          onClick={handleOpenUrl}
          fill="outline"
          data-testid="open-ssi-documentation-button"
          className="open-ssi-documentation-button secondary-button"
        >
          <IonIcon
            slot="end"
            icon={openOutline}
          />
          {isRecoveryMode
            ? `${i18n.t("ssiagent.button.recoverydocumentation")}`
            : `${i18n.t("ssiagent.button.onboardingdocumentation")}`}
        </IonButton>
      </TermsModal>
      <SwitchOnboardingModeModal
        mode={mode}
        isOpen={showSwitchModeModal}
        setOpen={setSwitchModeModal}
      />
    </>
  );
};

export { CreateSSIAgent };
