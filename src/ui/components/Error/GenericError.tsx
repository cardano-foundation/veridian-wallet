import { useCallback } from "react";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getShowCommonError,
  showGenericError,
} from "../../../store/reducers/stateCache";
import { Alert } from "../Alert";
import { CommonErrorAlertProps } from "./Error.types";
import { loggingConfig } from "../../../utils/logger/LoggingConfig";
import { logSyncService } from "../../../core/services/LogSyncService";

const CommonErrorAlert = ({
  isOpen,
  setIsOpen,
  dataTestId,
}: CommonErrorAlertProps) => {

  const closeError = () => {
    setIsOpen(false);
  };

  const handleShareLogs = async () => {
    await logSyncService.syncLogs();
    closeError();
  };
  
  return (
    <Alert
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      dataTestId={dataTestId}
      headerText={loggingConfig.remoteEnabled ? i18n.t("genericerror.logstext") as string : i18n.t("genericerror.text") as string}      
      confirmButtonText={loggingConfig.remoteEnabled ? i18n.t("genericerror.sharelogsbutton") as string : `${i18n.t("genericerror.button")}`}
      actionConfirm={loggingConfig.remoteEnabled ? handleShareLogs : closeError}
      secondaryConfirmButtonText={loggingConfig.remoteEnabled ? i18n.t("genericerror.dismissbutton") as string : undefined}
      actionSecondaryConfirm={loggingConfig.remoteEnabled ? closeError : undefined}
      className="app-error-alert"
    />
  );
};

const GenericError = () => {
  const dispatch = useAppDispatch();
  const isShowCommonError = useAppSelector(getShowCommonError);

  const showError = useCallback(
    (value: boolean) => {
      dispatch(showGenericError(value));
    },
    [dispatch]
  );

  const closeError = useCallback(() => {
    showError(false);
  }, [showError]);

  return (
    <CommonErrorAlert
      isOpen={!!isShowCommonError}
      setIsOpen={showError}
      actionConfirm={closeError}
      dataTestId="app-error-alert"
    />
  );
};

export { CommonErrorAlert, GenericError };
