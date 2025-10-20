import { useEffect, useState } from "react";
import { ConfigurationService } from "../../../../core/configuration";
import { i18n } from "../../../../i18n";
import { RoutePath } from "../../../../routes";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
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
    connectUrl: "",
    bootUrl: "",
  });
  const stateCache = useAppSelector(getStateCache);

  const dispatch = useAppDispatch();
  const [connectUrlInputTouched, setConnectUrlTouched] = useState(false);
  const [bootUrlInputTouched, setBootUrlInputTouched] = useState(false);
  const hasMismatchError = errors.hasMismatchError;
  const unknownError = errors.unknownError;
  const isInvalidBootUrl = errors.isInvalidBootUrl;
  const isInvalidConnectUrl = errors.isInvalidConnectUrl;

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

  useEffect(() => {
    if (!ssiAgent.bootUrl && !ssiAgent.connectUrl) {
      setConnectUrl(ConfigurationService.env?.keri?.keria?.url || undefined);
      setBootUrl(ConfigurationService.env?.keri?.keria?.bootUrl || undefined);
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

  const handleChangeConnectUrl = (connectionUrl: string) => {
    setErrors({
      isInvalidConnectUrl: false,
      hasMismatchError: false,
      unknownError: false,
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

  const handleConnect = () => {
    if (!ssiAgent.bootUrl || !ssiAgent.connectUrl) return;

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
            ? "ssiagent.advancedsetup.description"
            : "ssiagent.advancedsetup.description"
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
