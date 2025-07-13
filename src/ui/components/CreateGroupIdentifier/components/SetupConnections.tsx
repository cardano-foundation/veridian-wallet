import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Agent } from "../../../../core/agent/agent";
import { ConnectionShortDetails } from "../../../../core/agent/agent.types";
import { i18n } from "../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import {
  getMultiSigGroupCache,
  removeIdentifierCache,
  setScanGroupId,
} from "../../../../store/reducers/identifiersCache";
import {
  getCurrentOperation,
  getStateCache,
  setCurrentOperation,
  setToastMsg,
} from "../../../../store/reducers/stateCache";
import { OperationType, ToastMsgType } from "../../../globals/types";
import { useOnlineStatusEffect } from "../../../hooks";
import { showError } from "../../../utils/error";
import { getTheme } from "../../../utils/theme";
import { Alert } from "../../Alert";
import { TabsRoutePath } from "../../navigation/TabsMenu";
import { Verification } from "../../Verification";
import { IdentifierStageProps, Stage } from "../CreateGroupIdentifier.types";
import { SetupConnectionBodyInit } from "./SetupConnectionBodyInit";
import { SetupConnectionBodyResume } from "./SetupConnectionBodyResume";

const SetupConnections = ({
  state,
  setState,
  componentId,
  resetModal,
  resumeMultiSig,
  multiSigGroup,
  preventRedirect,
  isModalOpen,
  openAfterCreate,
}: IdentifierStageProps) => {
  const history = useHistory();
  const dispatch = useAppDispatch();
  const currentOperation = useAppSelector(getCurrentOperation);
  const multiSigGroupCache = useAppSelector(getMultiSigGroupCache);
  const [oobi, setOobi] = useState("");
  const identifierId = resumeMultiSig?.id || state.newIdentifier.id;
  const groupId =
    resumeMultiSig?.groupMetadata?.groupId ||
    state.newIdentifier.groupMetadata?.groupId;
  const groupMetadata =
    resumeMultiSig?.groupMetadata || state.newIdentifier.groupMetadata;
  const [alertIsOpen, setAlertIsOpen] = useState(false);
  const [initiated, setInitiated] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [alertDeleteOpen, setAlertDeleteOpen] = useState(false);
  const [scannedConections, setScannedConnections] = useState<
    ConnectionShortDetails[]
  >([]);

  useEffect(() => {
    if (isModalOpen) {
      dispatch(setScanGroupId(groupId));
    } else {
      dispatch(setScanGroupId(undefined));
    }
    fetchOobi();
  }, [isModalOpen, groupId, dispatch]);

  const fetchOobi = useCallback(async () => {
    try {
      const oobiValue = await Agent.agent.connections.getOobi(
        identifierId,
        groupId
      );
      if (oobiValue) {
        setOobi(oobiValue);
      }
    } catch (e) {
      showError("Unable to fetch Oobi", e, dispatch);
    }
  }, [groupId, dispatch]);

  useOnlineStatusEffect(fetchOobi);

  useEffect(() => {
    if (groupId) {
      const updateConnections = async () => {
        const connections = multiSigGroupCache?.connections;
        connections && setScannedConnections(connections);
      };
      updateConnections();
    }

    currentOperation === OperationType.MULTI_SIG_INITIATOR_INIT &&
      handleInitiateMultiSig();
  }, [groupMetadata, currentOperation, groupId, multiSigGroupCache]);

  const handleDone = () => {
    resetModal && resetModal();
    dispatch(setScanGroupId(undefined));
    if (multiSigGroup?.groupId && !preventRedirect) {
      history.push({
        pathname: TabsRoutePath.IDENTIFIERS,
      });
    }
  };

  const handleScanButton = () => {
    scannedConections.length >= 1 ? handleInitiateScan() : setAlertIsOpen(true);
  };

  const handleInitiateScan = () => {
    dispatch(
      setCurrentOperation(
        groupMetadata?.groupInitiator
          ? OperationType.MULTI_SIG_INITIATOR_SCAN
          : OperationType.MULTI_SIG_RECEIVER_SCAN
      )
    );
    setInitiated(true);
  };

  const handleInitiateMultiSig = () => {
    const theme = getTheme(resumeMultiSig?.theme || 0);

    dispatch(setCurrentOperation(OperationType.IDLE));
    setState((prevState) => ({
      ...prevState,
      scannedConections,
      displayNameValue:
        state.displayNameValue || resumeMultiSig?.displayName || "",
      ourIdentifier: state.ourIdentifier || resumeMultiSig?.id || "",
      identifierCreationStage: Stage.Members,
      color: theme.color,
      selectedTheme: theme.layout,
    }));
  };

  const openDeleteConfirm = () => {
    setAlertDeleteOpen(true);
  };

  const handleDelete = async () => {
    const identifierId = state.newIdentifier.id || resumeMultiSig?.id;
    if (!identifierId) return;

    try {
      setVerifyIsOpen(false);

      await Agent.agent.identifiers.markIdentifierPendingDelete(identifierId);

      dispatch(setToastMsg(ToastMsgType.IDENTIFIER_DELETED));
      dispatch(removeIdentifierCache(identifierId));
      handleDone();
    } catch (e) {
      showError(
        "Unable to delete identifier",
        e,
        dispatch,
        ToastMsgType.DELETE_IDENTIFIER_FAIL
      );
    }
  };

  const handleAuthentication = () => {
    setVerifyIsOpen(true);
  };

  return (
    <>
      {!openAfterCreate || initiated || scannedConections?.length ? (
        <SetupConnectionBodyResume
          componentId={componentId}
          handleDone={handleDone}
          handleInitiateMultiSig={handleInitiateMultiSig}
          oobi={oobi}
          identifierId={identifierId}
          groupMetadata={groupMetadata}
          handleScanButton={handleScanButton}
          scannedConections={scannedConections}
          handleDelete={openDeleteConfirm}
        />
      ) : (
        <SetupConnectionBodyInit
          componentId={componentId}
          handleDone={handleDone}
          oobi={oobi}
          identifierId={identifierId}
          groupMetadata={groupMetadata}
          handleScanButton={handleScanButton}
          scannedConections={scannedConections}
          handleDelete={openDeleteConfirm}
        />
      )}
      <Alert
        isOpen={alertIsOpen}
        setIsOpen={setAlertIsOpen}
        dataTestId="multisig-share-scan-alert"
        headerText={i18n.t("createidentifier.share.scanalert.text")}
        confirmButtonText={`${i18n.t(
          "createidentifier.share.scanalert.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "createidentifier.share.scanalert.cancel"
        )}`}
        actionConfirm={handleInitiateScan}
        actionCancel={() => setAlertIsOpen(false)}
        actionDismiss={() => setAlertIsOpen(false)}
      />
      <Alert
        isOpen={alertDeleteOpen}
        setIsOpen={setAlertDeleteOpen}
        dataTestId="alert-confirm-identifier-delete-details"
        headerText={i18n.t("tabs.identifiers.details.delete.alert.title")}
        confirmButtonText={`${i18n.t(
          "tabs.identifiers.details.delete.alert.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "tabs.identifiers.details.delete.alert.cancel"
        )}`}
        actionConfirm={() => handleAuthentication()}
        actionCancel={() => setAlertDeleteOpen(false)}
        actionDismiss={() => setAlertDeleteOpen(false)}
      />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={handleDelete}
      />
    </>
  );
};

export { SetupConnections };
