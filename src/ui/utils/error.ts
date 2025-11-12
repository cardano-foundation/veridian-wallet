import { logger } from "../../utils/logger/Logger";
import { formatErrorContext } from "../../utils/logger/loggerUtils";
import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import { setToastMsg, showGenericError } from "../../store/reducers/stateCache";
import { ToastMsgType } from "../globals/types";
import { Agent } from "../../core/agent/agent";

const showError = (
  message: string,
  error: unknown,
  dispatch?: ThunkDispatch<RootState, undefined, AnyAction>,
  toastMessage?: ToastMsgType
) => {
  logger.error(`${message}:`, formatErrorContext(error));

  if (!dispatch) return;

  if (error instanceof Error && error.message === Agent.KERIA_CONNECTION_BROKEN)
    return;

  if (toastMessage) {
    dispatch(setToastMsg(toastMessage));
  } else {
    dispatch(showGenericError(true));
  }
};

export { showError };
