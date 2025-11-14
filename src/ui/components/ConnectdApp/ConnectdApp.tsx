import { IonButton, IonIcon } from "@ionic/react";
import { addOutline, arrowBackOutline, repeatOutline } from "ionicons/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { PeerConnection } from "../../../core/cardano/walletConnect/peerConnection";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getConnectedDApp,
  getPeerConnections,
  getPendingDAppConnection,
  setConnectedDApp,
  setPeerConnections,
  setPendingDAppConnection,
} from "../../../store/reducers/profileCache";
import { getToastMsgs, setToastMsg } from "../../../store/reducers/stateCache";
import { Alert } from "../../components/Alert";
import { Verification } from "../../components/Verification";
import { ToastMsgType } from "../../globals/types";
import { showError } from "../../utils/error";
import { combineClassNames } from "../../utils/style";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import { PageHeader } from "../PageHeader";
import { Scan } from "../Scan";
import { useCameraDirection } from "../Scan/hook/useCameraDirection";
import { ScanRef } from "../Scan/Scan.types";
import { SideSlider } from "../SideSlider";
import { ConfirmConnectModal } from "./components/ConfirmConnectModal";
import { Connections } from "./components/Connections";
import { WalletConnect } from "./components/WalletConnect";
import "./ConnectdApp.scss";
import {
  ActionInfo,
  ActionType,
  ConnectdAppProps,
  DAppConnection,
  Step,
} from "./ConnectdApp.types";

const ConnectdApp = ({ isOpen, setIsOpen }: ConnectdAppProps) => {
  const dispatch = useAppDispatch();
  const toastMsgs = useAppSelector(getToastMsgs);
  const pendingConnection = useAppSelector(getPendingDAppConnection);
  const connections = useAppSelector(getPeerConnections);
  const connectedDApp = useAppSelector(getConnectedDApp);
  const pageId = "connect-dapp";
  const [actionInfo, setActionInfo] = useState<ActionInfo>({
    type: ActionType.None,
  });

  const [step, setStep] = useState(Step.Connections);
  const showScan = step === Step.Scan;

  const [openExistConnectedWalletAlert, setOpenExistConnectedWalletAlert] =
    useState<boolean>(false);
  const [openDeleteAlert, setOpenDeleteAlert] = useState<boolean>(false);
  const [openConfirmConnectModal, setOpenConfirmConnectModal] =
    useState<boolean>(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const { cameraDirection, changeCameraDirection, supportMultiCamera } =
    useCameraDirection();
  const [enableCameraDirection, setEnableCameraDirection] = useState(false);
  const scanRef = useRef<ScanRef>(null);

  const handleOpenVerify = () => {
    setVerifyIsOpen(true);
  };

  const handleOpenDeleteAlert = (data: DAppConnection) => {
    setActionInfo({
      type: ActionType.Delete,
      data,
    });

    setOpenDeleteAlert(true);
  };

  const handleOpenConfirmConnectModal = (data: DAppConnection) => {
    setActionInfo({
      type: ActionType.Connect,
      data,
    });
    setOpenConfirmConnectModal(true);
  };

  const closeDeleteAlert = () => {
    setActionInfo({
      type: ActionType.None,
    });

    setOpenDeleteAlert(false);
  };

  const verifyPassCodeBeforeDelete = () => {
    setOpenDeleteAlert(false);
    handleOpenVerify();
  };

  const handleDeleteConnection = async (data: DAppConnection) => {
    try {
      setActionInfo({
        type: ActionType.None,
      });
      if (connectedDApp) {
        PeerConnection.peerConnection.disconnectDApp(connectedDApp?.meerkatId);
        dispatch(setConnectedDApp(null));
      }
      await Agent.agent.peerConnectionPair.deletePeerConnectionPairRecord(
        `${data.meerkatId}:${data.selectedAid}`
      );

      dispatch(
        setPeerConnections(
          connections.filter(
            (connection) => connection.meerkatId !== data.meerkatId
          )
        )
      );

      if (data.meerkatId === pendingConnection?.meerkatId) {
        dispatch(setPendingDAppConnection(null));
      }

      dispatch(setToastMsg(ToastMsgType.WALLET_CONNECTION_DELETED));
    } catch (e) {
      showError("Unable to delete peer connection", e, dispatch);
    }
  };

  const disconnectWallet = () => {
    if (!connectedDApp) return;
    PeerConnection.peerConnection.disconnectDApp(connectedDApp?.meerkatId);
  };

  const toggleConnected = () => {
    if (!actionInfo.data) return;
    const isConnectedItem =
      actionInfo.data.meerkatId === connectedDApp?.meerkatId;

    if (isConnectedItem) {
      disconnectWallet();
      return;
    }

    if (connectedDApp) {
      setOpenExistConnectedWalletAlert(true);
      return;
    }

    dispatch(setPendingDAppConnection(actionInfo.data));
    setStep(Step.Confirm);
  };

  const handleAfterVerify = () => {
    setVerifyIsOpen(false);

    if (actionInfo.type === ActionType.Delete && actionInfo.data) {
      handleDeleteConnection(actionInfo.data);
    }
  };

  const handleScanQR = () => {
    if (connectedDApp) {
      setActionInfo({
        type: ActionType.Add,
      });
      setOpenExistConnectedWalletAlert(true);
      return;
    }

    setStep(Step.Scan);
  };

  const handleCloseExistConnectedWallet = () => {
    setOpenExistConnectedWalletAlert(false);
    setActionInfo({
      type: ActionType.None,
    });
  };

  const handleContinueScanQRWithExistedConnection = () => {
    disconnectWallet();
    if (actionInfo.type === ActionType.Connect && actionInfo.data) {
      dispatch(setPendingDAppConnection(actionInfo.data));
    } else {
      setStep(Step.Scan);
    }
    handleCloseExistConnectedWallet();
  };

  // NOTE: Reload connection data after connect success
  useEffect(() => {
    if (
      toastMsgs.some(
        (item) => item.message === ToastMsgType.CONNECT_WALLET_SUCCESS
      ) &&
      !pendingConnection &&
      connectedDApp &&
      openConfirmConnectModal
    ) {
      setActionInfo({
        type: ActionType.Connect,
        data: connectedDApp,
      });
    }
  }, [connectedDApp, toastMsgs, pendingConnection, openConfirmConnectModal]);

  const handleClose = () => {
    if (showScan) {
      setStep(Step.Connections);
      return;
    }

    if (step == Step.Confirm) {
      setStep(Step.Scan);
      return;
    }

    setIsOpen(false);
  };

  const handleConnectWallet = async (id: string) => {
    if (/^b[1-9A-HJ-NP-Za-km-z]{33}/.test(id)) {
      dispatch(setToastMsg(ToastMsgType.PEER_ID_SUCCESS));
      dispatch(
        setPendingDAppConnection({
          meerkatId: id,
        })
      );
      setStep(Step.Confirm);
    } else {
      dispatch(setToastMsg(ToastMsgType.PEER_ID_ERROR));
    }
  };

  const title = useMemo(() => {
    if (step == Step.Confirm)
      return `${i18n.t("connectdapp.request.stageone.title")}`;

    if (step == Step.Connections) return `${i18n.t("connectdapp.title")}`;

    return undefined;
  }, [step]);

  const handleAfterConnect = () => {
    if (!pendingConnection) return;

    setStep(Step.Connections);
    handleOpenConfirmConnectModal(pendingConnection);
  };

  const getContent = () => {
    switch (step) {
      case Step.Scan:
        return (
          <Scan
            onFinishScan={handleConnectWallet}
            cameraDirection={cameraDirection}
            onCheckPermissionFinish={setEnableCameraDirection}
            ref={scanRef}
            displayOnModal
          />
        );
      case Step.Confirm:
        return (
          <WalletConnect
            handleAfterConnect={handleAfterConnect}
            close={setStep}
          />
        );
      default:
        return (
          <Connections
            pageId={pageId}
            handleDelete={handleOpenDeleteAlert}
            onCardClick={handleOpenConfirmConnectModal}
            handleScanQR={handleScanQR}
          />
        );
    }
  };

  const classes = combineClassNames({
    "connect-dapp-scan": step === Step.Scan,
  });

  return (
    <>
      <SideSlider
        renderAsModal
        isOpen={isOpen}
        className="connect-dapp-modal"
      >
        <ScrollablePageLayout
          pageId={pageId}
          activeStatus={isOpen}
          customClass={classes}
          header={
            <PageHeader
              closeButton
              closeButtonAction={handleClose}
              closeButtonIcon={arrowBackOutline}
              title={title}
              additionalButtons={
                showScan ? undefined : (
                  <IonButton
                    shape="round"
                    className="connect-wallet-button"
                    data-testid="menu-add-connection-button"
                    onClick={handleScanQR}
                  >
                    <IonIcon
                      slot="icon-only"
                      icon={addOutline}
                      color="primary"
                    />
                  </IonButton>
                )
              }
              actionButton={showScan && supportMultiCamera}
              actionButtonIcon={showScan ? repeatOutline : undefined}
              actionButtonAction={showScan ? changeCameraDirection : undefined}
              actionButtonDisabled={showScan && !enableCameraDirection}
            />
          }
        >
          {getContent()}
        </ScrollablePageLayout>
      </SideSlider>
      <ConfirmConnectModal
        isConnectModal={actionInfo.data?.meerkatId !== connectedDApp?.meerkatId}
        openModal={openConfirmConnectModal}
        closeModal={() => setOpenConfirmConnectModal(false)}
        onConfirm={toggleConnected}
        connectionData={actionInfo.data}
        onDeleteConnection={handleOpenDeleteAlert}
      />
      <Alert
        isOpen={openDeleteAlert}
        setIsOpen={setOpenDeleteAlert}
        dataTestId="alert-delete"
        headerText={i18n.t("connectdapp.connectionhistory.deletealert.message")}
        confirmButtonText={`${i18n.t(
          "connectdapp.connectionhistory.deletealert.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "connectdapp.connectionhistory.deletealert.cancel"
        )}`}
        actionConfirm={verifyPassCodeBeforeDelete}
        actionCancel={closeDeleteAlert}
        actionDismiss={closeDeleteAlert}
      />
      <Alert
        isOpen={openExistConnectedWalletAlert}
        setIsOpen={setOpenExistConnectedWalletAlert}
        dataTestId="alert-disconnect-wallet"
        headerText={i18n.t("connectdapp.disconnectbeforecreatealert.message")}
        confirmButtonText={`${i18n.t(
          "connectdapp.disconnectbeforecreatealert.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "connectdapp.disconnectbeforecreatealert.cancel"
        )}`}
        actionConfirm={handleContinueScanQRWithExistedConnection}
        actionCancel={handleCloseExistConnectedWallet}
        actionDismiss={handleCloseExistConnectedWallet}
      />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={handleAfterVerify}
      />
    </>
  );
};

export { ConnectdApp };
