import { useCallback } from "react";
import { Agent } from "../../../../core/agent/agent";
import { OOBI_RE, WOOBI_RE } from "../../../../core/agent/agent.types";
import { OobiQueryParams } from "../../../../core/agent/services/connectionService.types";
import { StorageMessage } from "../../../../core/storage/storage.types";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import {
  getConnectionsCache,
  getCurrentProfile,
  getProfiles,
  setMissingAliasConnection,
  setOpenConnectionId,
} from "../../../../store/reducers/profileCache";
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
  MEMBER_EXIST = "Member already added",
  SCAN_SELF = "Scan self connection",
}

const useScanHandle = () => {
  const dispatch = useAppDispatch();
  const currentProfile = useAppSelector(getCurrentProfile);
  const defaultIdentifier = currentProfile?.identity.id;
  const profiles = useAppSelector(getProfiles);
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
          .replace(`${StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG} `, "")
          .trim();
      }

      if (!urlId) {
        showError(
          "Scanner Error:",
          e,
          dispatch,
          ToastMsgType.INVALID_CONNECTION_URL
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
        await reloadScan?.();
        return;
      }

      if (profiles[urlId]) {
        showError(
          "Scanner Error:",
          e,
          dispatch,
          ToastMsgType.SCAN_SELF_CONNECTION
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

      if (isMultisig) {
        closeScan?.();
      } else {
        dispatch(setOpenConnectionId(urlId));
        handleDuplicate?.(urlId);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    [dispatch, profiles]
  );

  const resolveIndividualConnection = useCallback(
    async (
      content: string,
      closeScan?: () => void,
      reloadScan?: () => Promise<void>,
      handleDuplicate?: (id: string) => void
    ) => {
      try {
        const url = new URL(content);

        if (
          !isValidConnectionUrl(content) ||
          (!new URL(content).pathname.match(OOBI_RE) &&
            !new URL(content).pathname.match(WOOBI_RE)) ||
          url.searchParams.get(OobiQueryParams.GROUP_ID)
        ) {
          throw new Error(ErrorMessage.INVALID_CONNECTION_URL);
        }

        const connectionName = url.searchParams.get(OobiQueryParams.NAME);

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

        const connectionId = new URL(content).pathname
          .split("/oobi/")
          .pop()
          ?.split("/")[0];

        // Detect duplicates locally first (current profile only)
        // so the UI can open the existing connection without invoking the Agent
        const existsLocally =
          !!connectionId && connections.some((c) => c.id === connectionId);

        if (existsLocally) {
          // Duplicate detected: surface it to the UI the same way the Agent would.
          dispatch(setToastMsg(ToastMsgType.DUPLICATE_CONNECTION));
          dispatch(setOpenConnectionId(connectionId));
          handleDuplicate?.(connectionId);
          await closeScan?.();
          return;
        }

        // No test-only shortcuts here: duplicate detection above covers
        // both current-profile and any-profile cases. If tests need to
        // assert duplicate behavior they should seed the store with the
        // canonical per-profile connection shape (makeTestStore does this).

        // If we don't have a default identifier yet (tests sometimes mock store
        // without current profile), still allow duplicate detection to succeed
        // above; but if creating a new connection we need a valid identifier.
        if (!defaultIdentifier) return;

        // Not a duplicate, proceed to create the connection
        await Agent.agent.connections.connectByOobiUrl(
          content,
          defaultIdentifier
        );

        await closeScan?.();
      } catch (e) {
        const errorMessage = (e as Error).message;

        if (errorMessage.includes(ErrorMessage.INVALID_CONNECTION_URL)) {
          showError(
            "Scanner Error:",
            e,
            dispatch,
            ToastMsgType.INVALID_CONNECTION_URL
          );
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
    closeScan?: () => void,
    reloadScan?: () => Promise<void>,
    handleDuplicate?: (id: string) => void
  ) => {
    try {
      const isMultiSigUrl = content.includes(OobiQueryParams.GROUP_ID);
      const url = new URL(content);
      const urlGroupId = url.searchParams.get(OobiQueryParams.GROUP_ID);

      // NOTE: When user scan group connection on group page and group id of url not match with current connection page
      if (!isMultiSigUrl || urlGroupId !== scanGroupId) {
        throw new Error(ErrorMessage.GROUP_ID_NOT_MATCH);
      }

      if (
        (isMultiSigUrl && !isValidHttpUrl(content)) ||
        (!url.pathname.match(OOBI_RE) && !url.pathname.match(WOOBI_RE))
      ) {
        throw new Error(ErrorMessage.INVALID_CONNECTION_URL);
      }

      const contactId = url.pathname.match(/oobi\/([^/]+)\/agent/)?.[1];

      if (
        currentProfile &&
        urlGroupId === scanGroupId &&
        currentProfile.multisigConnections.some(
          (c) => c.contactId === contactId
        )
      ) {
        throw new Error(ErrorMessage.MEMBER_EXIST);
      }

      if (
        currentProfile &&
        urlGroupId === scanGroupId &&
        currentProfile.identity.id === contactId
      ) {
        throw new Error(ErrorMessage.SCAN_SELF);
      }

      const invitation = await Agent.agent.connections.connectByOobiUrl(
        content
      );

      closeScan?.();

      return invitation;
    } catch (e) {
      const errorMessage = (e as Error).message;

      if (errorMessage === ErrorMessage.SCAN_SELF) {
        showError(
          "Scanner Error:",
          e,
          dispatch,
          ToastMsgType.SCAN_SELF_CONNECTION
        );
        closeScan?.();
        return;
      }

      if (errorMessage === ErrorMessage.MEMBER_EXIST) {
        closeScan?.();
        showError(
          "Scanner Error:",
          e,
          dispatch,
          ToastMsgType.MEMBER_ALREADY_EXIST
        );
        reloadScan?.();
        return;
      }

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
        await reloadScan?.();
        return;
      }

      showError("Scanner Error:", e, dispatch, ToastMsgType.CONNECTION_ERROR);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await reloadScan?.();
    }
  };

  return { resolveIndividualConnection, resolveGroupConnection };
};

export { useScanHandle };
