import { useState } from "react";
import { ConfigurationService } from "../../../../core/configuration";
import { i18n } from "../../../../i18n";
import { RoutePath } from "../../../../routes";
import { useAppSelector } from "../../../../store/hooks";
import { getStateCache } from "../../../../store/reducers/stateCache";
import { CustomInput } from "../../../components/CustomInput";
import { ErrorMessage } from "../../../components/ErrorMessage";
import { ScrollablePageLayout } from "../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../components/PageFooter";
import { PageHeader } from "../../../components/PageHeader";
import { isValidHttpUrl } from "../../../utils/urlChecker";
import {
  AdvancedSettingProps,
  CurrentPage,
  SSIAgentState,
} from "../CreateSSIAgent.types";

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

export const removeLastSlash = (url: string) => {
  let result = url;

  while (result && result.length > 0 && url[result.length - 1] === "/") {
    result = result.substring(0, result.length - 1);
  }

  return result;
};

const AdvancedSetting = ({
  onSubmitForm,
  setCurrentPage,
  setErrors,
  errors,
}: AdvancedSettingProps) => {
  const pageId = "create-ssi-agent";
  const [ssiAgent, setSsiAgent] = useState<SSIAgentState>({
    connectUrl: ConfigurationService.env?.keri?.keria?.url || "",
    bootUrl: ConfigurationService.env?.keri?.keria?.bootUrl || "",
  });
  const stateCache = useAppSelector(getStateCache);
  const [connectUrlInputTouched, setConnectUrlTouched] = useState(false);
  const [bootUrlInputTouched, setBootUrlInputTouched] = useState(false);
  const {
    hasMismatchError,
    networkIssue,
    isInvalidBootUrl,
    isInvalidConnectUrl,
  } = errors;

  const isRecoveryMode = stateCache.authentication.recoveryWalletProgress;

  const setConnectUrl = (connectUrl?: string) => {
    setSsiAgent((value) => ({
      ...value,
      connectUrl,
    }));
  };

  const setBootUrl = (bootUrl?: string) => {
    setSsiAgent((value) => ({
      ...value,
      bootUrl,
    }));
  };

  const setTouchedConnectUrlInput = () => {
    setConnectUrlTouched(true);
  };

  const setTouchedBootUrlInput = () => {
    setBootUrlInputTouched(true);
  };

  const validInputBootUrl =
    isRecoveryMode || (ssiAgent.bootUrl && isValidHttpUrl(ssiAgent.bootUrl));

  const validInputConnectUrl =
    ssiAgent.connectUrl && isValidHttpUrl(ssiAgent.connectUrl);

  const displayBootUrlError =
    (!isRecoveryMode &&
      bootUrlInputTouched &&
      ssiAgent.bootUrl &&
      !isValidHttpUrl(ssiAgent.bootUrl)) ||
    isInvalidBootUrl;

  const displayConnectUrlError =
    (connectUrlInputTouched &&
      ssiAgent.connectUrl &&
      !isValidHttpUrl(ssiAgent.connectUrl)) ||
    isInvalidConnectUrl;

  const validated = validInputBootUrl && validInputConnectUrl;

  const handleChangeConnectUrl = (connectionUrl: string) => {
    setErrors({
      isInvalidConnectUrl: false,
      hasMismatchError: false,
      networkIssue: false,
    });
    setConnectUrl(connectionUrl);
  };

  const handleChangeBootUrl = (bootUrl: string) => {
    setErrors({
      isInvalidBootUrl: false,
    });
    setBootUrl(bootUrl);
  };

  const showConnectionUrlError =
    !!displayConnectUrlError ||
    hasMismatchError ||
    isInvalidConnectUrl ||
    networkIssue;
  const connectionUrlError = (() => {
    if (!showConnectionUrlError) return "";

    if (networkIssue) {
      return "ssiagent.error.networkissue";
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

  const bootUrlError = (() => {
    if (isRecoveryMode || !displayBootUrlError) return "";

    if ((displayBootUrlError || isInvalidBootUrl) && !displayConnectUrlError)
      return "ssiagent.error.invalidbooturl";

    return "ssiagent.error.invalidurl";
  })();

  const handleConnect = () => {
    onSubmitForm(ssiAgent.bootUrl, ssiAgent.connectUrl);
  };

  return (
    <ScrollablePageLayout
      pageId={pageId}
      header={
        <PageHeader
          currentPath={RoutePath.SSI_AGENT}
          title={`${i18n.t("ssiagent.advancedsetup.title")}`}
          closeButton
          closeButtonLabel={`${i18n.t(
            "ssiagent.advancedsetup.buttons.cancel"
          )}`}
          closeButtonAction={() => setCurrentPage(CurrentPage.Scan)}
        />
      }
      footer={
        <PageFooter
          pageId={pageId}
          primaryButtonText={`${i18n.t(
            "ssiagent.advancedsetup.buttons.connect"
          )}`}
          primaryButtonAction={handleConnect}
          primaryButtonDisabled={!validated}
        />
      }
    >
      <p
        className="page-paragraph"
        data-testid={`${pageId}-top-paragraph`}
      >
        {i18n.t(
          isRecoveryMode
            ? "ssiagent.advancedsetup.description.connect"
            : "ssiagent.advancedsetup.description.connectboot"
        )}
      </p>
      {!isRecoveryMode && (
        <>
          <CustomInput
            className="boot-url-input"
            dataTestId="boot-url-input"
            title={`${i18n.t("ssiagent.advancedsetup.input.boot.label")}`}
            placeholder={`${i18n.t(
              "ssiagent.advancedsetup.input.boot.placeholder"
            )}`}
            onChangeInput={handleChangeBootUrl}
            value={ssiAgent.bootUrl || ""}
            onChangeFocus={(result) => {
              setTouchedBootUrlInput();

              if (!result && ssiAgent.bootUrl) {
                setBootUrl(removeLastSlash(ssiAgent.bootUrl.trim()));
              }
            }}
            error={displayBootUrlError}
          />
          <InputError
            showError={displayBootUrlError}
            errorMessage={`${i18n.t(bootUrlError)}`}
          />
        </>
      )}
      <CustomInput
        className="connect-url-input"
        dataTestId="connect-url-input"
        title={`${i18n.t("ssiagent.advancedsetup.input.connect.label")}`}
        placeholder={`${i18n.t(
          "ssiagent.advancedsetup.input.connect.placeholder"
        )}`}
        onChangeInput={handleChangeConnectUrl}
        onChangeFocus={(result) => {
          setTouchedConnectUrlInput();

          if (!result && ssiAgent.connectUrl) {
            setConnectUrl(removeLastSlash(ssiAgent.connectUrl.trim()));
          }
        }}
        value={ssiAgent.connectUrl || ""}
        error={showConnectionUrlError}
      />
      <InputError
        showError={showConnectionUrlError}
        errorMessage={`${i18n.t(connectionUrlError)}`}
      />
    </ScrollablePageLayout>
  );
};

export { AdvancedSetting };
