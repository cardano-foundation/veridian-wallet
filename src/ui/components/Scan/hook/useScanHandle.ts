import { useCallback } from "react";
import { Agent } from "../../../../core/agent/agent";
import {
  OOBI_AGENT_ONLY_RE,
  OobiType,
  WOOBI_RE,
} from "../../../../core/agent/agent.types";
import { OobiQueryParams } from "../../../../core/agent/services/connectionService.types";
import { StorageMessage } from "../../../../core/storage/storage.types";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import {
  getConnectionsCache,
  setMissingAliasConnection,
  setOpenConnectionId,
  updateOrAddMultisigConnectionCache,
} from "../../../../store/reducers/connectionsCache";
import { getCurrentProfile } from "../../../../store/reducers/profileCache";
import { setToastMsg } from "../../../../store/reducers/stateCache";
import { ToastMsgType } from "../../../globals/types";
import { showError } from "../../../utils/error";
import {
  isValidConnectionUrl,
  isValidHttpUrl,
} from "../../../utils/urlChecker";

enum ErrorMessage {
  INVALID_CONNECTION_URL = "Invalid connection url",
  GROUP_ID_NOT_MATCH = "Multisig group id not match",
}

const useScanHandle = () => {
  const dispatch = useAppDispatch();
  const defaultIdentifier = useAppSelector(getCurrentProfile)?.identity.id;
  const connections = useAppSelector(getConnectionsCache);

  const handleDuplicateConnectionError = useCallback(
    async (
      e: Error,
      url: string,
      isMultisig: boolean,
      closeScan?: () => void,
      reloadScan?: () => Promise<void>,
      handleDuplicate?: (id: string) => void
    ) => {
      let urlId: string | null = null;
      if (isMultisig) {
        urlId = new URL(url).searchParams.get(OobiQueryParams.GROUP_ID);
      } else {
        urlId = e.message
          .replace(`${StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG}: `, "")
          .trim();
      }

      if (!urlId) {
        showError("Scanner Error:", e, dispatch, ToastMsgType.SCANNER_ERROR);
        await new Promise((resolve) => setTimeout(resolve, 500));
        await reloadScan?.();
        return;
      }

      showError(
        "Scanner Error:",
        e,
        dispatch,
        ToastMsgType.DUPLICATE_CONNECTION
      );

      if (isMultisig) {
        closeScan?.();
      } else {
        dispatch(setOpenConnectionId(urlId));
        handleDuplicate?.(urlId);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    [dispatch]
  );

  const resolveIndividualConnection = useCallback(
    async (
      content: string,
      closeScan?: () => void,
      reloadScan?: () => Promise<void>,
      handleDuplicate?: (id: string) => void
    ) => {
      try {
        if (
          !isValidConnectionUrl(content) ||
          (!new URL(content).pathname.match(OOBI_AGENT_ONLY_RE) &&
            !new URL(content).pathname.match(WOOBI_RE))
        ) {
          throw new Error(ErrorMessage.INVALID_CONNECTION_URL);
        }

        const connectionName = new URL(content).searchParams.get(
          OobiQueryParams.NAME
        );

        if (!connectionName) {
          setTimeout(() => {
            dispatch(
              setMissingAliasConnection({
                url: content,
                identifier: defaultIdentifier,
              })
            );
          });
          await closeScan?.();
          return;
        }

        if (!defaultIdentifier) return;

        const connectionId = new URL(content).pathname
          .split("/oobi/")
          .pop()
          ?.split("/")[0];

        if (connectionId && connections[connectionId]) {
          throw new Error(
            `${StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG}: ${connectionId}`
          );
        }

        await Agent.agent.connections.connectByOobiUrl(
          content,
          defaultIdentifier
        );

        await closeScan?.();
      } catch (e) {
        const errorMessage = (e as Error).message;

        if (errorMessage.includes(ErrorMessage.INVALID_CONNECTION_URL)) {
          showError("Scanner Error:", e, dispatch, ToastMsgType.SCANNER_ERROR);
          await new Promise((resolve) => setTimeout(resolve, 500));
          await reloadScan?.();
          return;
        }

        if (
          errorMessage.includes(StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG)
        ) {
          handleDuplicateConnectionError(
            e as Error,
            content,
            false,
            closeScan,
            reloadScan,
            handleDuplicate
          );
          return;
        }

        showError("Scanner Error:", e, dispatch);
        closeScan?.();
      }
    },
    [connections, defaultIdentifier, dispatch, handleDuplicateConnectionError]
  );

  const resolveGroupConnection = async (
    content: string,
    scanGroupId: string,
    isInitiator: boolean,
    closeScan?: () => void,
    reloadScan?: () => Promise<void>,
    handleDuplicate?: (id: string) => void
  ) => {
    try {
      const isMultiSigUrl = content.includes(OobiQueryParams.GROUP_ID);
      const urlGroupId = new URL(content).searchParams.get(
        OobiQueryParams.GROUP_ID
      );

      // NOTE: When user scan group connection on group page and group id of url not match with current connection page
      if (!isMultiSigUrl || urlGroupId !== scanGroupId) {
        throw new Error(ErrorMessage.GROUP_ID_NOT_MATCH);
      }

      if (
        (isMultiSigUrl && !isValidHttpUrl(content)) ||
        (!new URL(content).pathname.match(OOBI_AGENT_ONLY_RE) &&
          !new URL(content).pathname.match(WOOBI_RE))
      ) {
        throw new Error(ErrorMessage.INVALID_CONNECTION_URL);
      }

      const invitation = await Agent.agent.connections.connectByOobiUrl(
        content
      );

      if (invitation.type === OobiType.NORMAL) {
        if (isInitiator) {
          dispatch(updateOrAddMultisigConnectionCache(invitation.connection));
        }
      }

      if (invitation.type === OobiType.MULTI_SIG_INITIATOR) {
        dispatch(updateOrAddMultisigConnectionCache(invitation.connection));
        dispatch(setToastMsg(ToastMsgType.NEW_MULTI_SIGN_MEMBER));
      }

      closeScan?.();
    } catch (e) {
      const errorMessage = (e as Error).message;

      if (
        errorMessage.includes(StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG)
      ) {
        await handleDuplicateConnectionError(
          e as Error,
          content,
          true,
          closeScan,
          reloadScan,
          handleDuplicate
        );
        return;
      }

      if (errorMessage.includes(ErrorMessage.GROUP_ID_NOT_MATCH)) {
        showError(
          "Scanner Error:",
          e,
          dispatch,
          ToastMsgType.GROUP_ID_NOT_MATCH_ERROR
        );
        return;
      }

      showError("Scanner Error:", e, dispatch, ToastMsgType.SCANNER_ERROR);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await reloadScan?.();
    }
  };

  return { resolveIndividualConnection, resolveGroupConnection };
};

export { useScanHandle };
