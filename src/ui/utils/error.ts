import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import { Agent } from "../../core/agent/agent";
import { RootState } from "../../store";
import {
  setToastMsg,
  showGenericError,
  showVerifySeedPhraseAlert,
} from "../../store/reducers/stateCache";
import { ToastMsgType } from "../globals/types";

const showError = (
  message: string,
  error: unknown,
  dispatch?: ThunkDispatch<RootState, undefined, AnyAction>,
  toastMessage?: ToastMsgType
) => {
  // eslint-disable-next-line no-console
  console.error(`${message}:`, error);

  if (
    error instanceof Error &&
    error.message.includes(Agent.SEED_PHRASE_NOT_VERIFIED)
  ) {
    // if we has dispatch as a param => show method
    if (dispatch) {
      dispatch(showVerifySeedPhraseAlert(true));
      return;
    } else {
      // If it's a seed phrase verification error, we will pass it to the global error handler.
      throw error;
    }
  }

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
