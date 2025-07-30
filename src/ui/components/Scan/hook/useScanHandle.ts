import { useCallback } from "react";
import { Agent } from "../../../../core/agent/agent";
import {
  OOBI_AGENT_ONLY_RE,
  WOOBI_RE,
} from "../../../../core/agent/agent.types";
import { OobiQueryParams } from "../../../../core/agent/services/connectionService.types";
import { StorageMessage } from "../../../../core/storage/storage.types";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import {
  getConnectionsCache,
  setMissingAliasConnection,
  setOpenConnectionId,
} from "../../../../store/reducers/connectionsCache";
import { getCurrentProfile } from "../../../../store/reducers/stateCache";
import { ToastMsgType } from "../../../globals/types";
import { showError } from "../../../utils/error";
import { isValidConnectionUrl } from "../../../utils/urlChecker";

enum ErrorMessage {
  INVALID_CONNECTION_URL = "Invalid connection url",
  GROUP_ID_NOT_MATCH = "Multisig group id not match",
}

const useScanHandle = () => {
  const dispatch = useAppDispatch();
  const defaultIdentifier = useAppSelector(getCurrentProfile).identity.id;
  const connections = useAppSelector(getConnectionsCache);

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
          const urlId = errorMessage
            .replace(`${StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG}:`, "")
            .trim();

          if (!urlId) {
            showError(
              "Scanner Error:",
              e,
              dispatch,
              ToastMsgType.SCANNER_ERROR
            );
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
          dispatch(setOpenConnectionId(urlId));
          handleDuplicate?.(urlId);
          await new Promise((resolve) => setTimeout(resolve, 500));
          return;
        }

        showError("Scanner Error:", e, dispatch);
        closeScan?.();
      }
    },
    [connections, defaultIdentifier, dispatch]
  );

  return { resolveIndividualConnection };
};

export { useScanHandle };
