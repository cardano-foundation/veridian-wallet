import {
  IonButton,
  IonCheckbox,
  IonChip,
  IonIcon,
  IonItemOption,
} from "@ionic/react";
import { addOutline, arrowBackOutline, hourglassOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { PeerConnection } from "../../../core/cardano/walletConnect/peerConnection";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getCurrentOperation,
  getToastMsgs,
  setCurrentOperation,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import {
  ConnectionData,
  getConnectedWallet,
  getPendingConnection,
  getWalletConnectionsCache,
  setConnectedWallet,
  setPendingConnection,
  setWalletConnectionsCache,
} from "../../../store/reducers/walletConnectionsCache";
import { Alert } from "../../components/Alert";
import { CardList } from "../../components/CardList";
import { CardsPlaceholder } from "../../components/CardsPlaceholder";
import { ANIMATION_DURATION } from "../../components/SideSlider/SideSlider.types";
import { Verification } from "../../components/Verification";
import { OperationType, ToastMsgType } from "../../globals/types";
import { showError } from "../../utils/error";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import { PageHeader } from "../PageHeader";
import { SideSlider } from "../SideSlider";
import { ConfirmConnectModal } from "./components/ConfirmConnectModal";
import "./ConnectdApp.scss";
import { ActionInfo, ActionType, ConnectdAppProps } from "./ConnectdApp.types";

const ConnectdApp = ({ isOpen, setIsOpen }: ConnectdAppProps) => {
  const dispatch = useAppDispatch();
  const toastMsgs = useAppSelector(getToastMsgs);
  const pendingConnection = useAppSelector(getPendingConnection);
  const connections = useAppSelector(getWalletConnectionsCache);
  const connectedWallet = useAppSelector(getConnectedWallet);
  const currentOperation = useAppSelector(getCurrentOperation);
  const pageId = "wallet-connect";
  const [actionInfo, setActionInfo] = useState<ActionInfo>({
    type: ActionType.None,
  });
  const [openExistConenctedWalletAlert, setOpenExistConnectedWalletAlert] =
    useState<boolean>(false);
  const [openDeleteAlert, setOpenDeleteAlert] = useState<boolean>(false);
  const [openConfirmConnectModal, setOpenConfirmConnectModal] =
    useState<boolean>(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);

  const displayConnection = connections.map((connection) => {
    const dAppName = connection.name ? connection.name : connection.meerkatId;
    return {
      id: connection.meerkatId,
      title: dAppName,
      url: connection.url,
      subtitle: connection.url,
      image: connection.iconB64,
      data: connection,
    };
  });

  const handleOpenVerify = () => {
    setVerifyIsOpen(true);
  };

  const handleOpenDeleteAlert = (data: ConnectionData) => {
    setActionInfo({
      type: ActionType.Delete,
      data,
    });

    setOpenDeleteAlert(true);
  };

  const handleOpenConfirmConnectModal = (data: ConnectionData) => {
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

  const handleDeleteConnection = async (data: ConnectionData) => {
    try {
      setActionInfo({
        type: ActionType.None,
      });
      if (connectedWallet) {
        PeerConnection.peerConnection.disconnectDApp(
          connectedWallet?.meerkatId
        );
        dispatch(setConnectedWallet(null));
      }
      await Agent.agent.peerConnectionPair.deletePeerConnectionPairRecord(
        `${data.meerkatId}:${data.selectedAid}`
      );

      dispatch(
        setWalletConnectionsCache(
          connections.filter(
            (connection) => connection.meerkatId !== data.meerkatId
          )
        )
      );

      if (data.meerkatId === pendingConnection?.meerkatId) {
        dispatch(setPendingConnection(null));
      }

      dispatch(setToastMsg(ToastMsgType.WALLET_CONNECTION_DELETED));
    } catch (e) {
      showError("Unable to delete peer connection", e, dispatch);
    }
  };

  const disconnectWallet = () => {
    if (!connectedWallet) return;
    PeerConnection.peerConnection.disconnectDApp(connectedWallet?.meerkatId);
  };

  const toggleConnected = () => {
    if (!actionInfo.data) return;
    const isConnectedItem =
      actionInfo.data.meerkatId === connectedWallet?.meerkatId;
    if (isConnectedItem) {
      disconnectWallet();
      return;
    }

    if (connectedWallet) {
      setOpenExistConnectedWalletAlert(true);
      return;
    }

    dispatch(setPendingConnection(actionInfo.data));
  };

  const handleAfterVerify = () => {
    setVerifyIsOpen(false);

    if (actionInfo.type === ActionType.Delete && actionInfo.data) {
      handleDeleteConnection(actionInfo.data);
    }
  };

  const handleScanQR = () => {
    if (connectedWallet) {
      setActionInfo({
        type: ActionType.Add,
      });
      setOpenExistConnectedWalletAlert(true);
      return;
    }

    dispatch(setCurrentOperation(OperationType.SCAN_WALLET_CONNECTION));
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
      dispatch(setPendingConnection(actionInfo.data));
    } else {
      dispatch(setCurrentOperation(OperationType.SCAN_WALLET_CONNECTION));
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
      connectedWallet &&
      openConfirmConnectModal
    ) {
      setActionInfo({
        type: ActionType.Connect,
        data: connectedWallet,
      });
    }
  }, [connectedWallet, toastMsgs, pendingConnection, openConfirmConnectModal]);

  useEffect(() => {
    if (!pendingConnection) return;

    if (
      OperationType.OPEN_WALLET_CONNECTION_DETAIL === currentOperation &&
      pendingConnection
    ) {
      dispatch(setCurrentOperation(OperationType.IDLE));
      setTimeout(() => {
        handleOpenConfirmConnectModal(pendingConnection);
      }, ANIMATION_DURATION);
    }
  }, [currentOperation, dispatch, pendingConnection]);

  return (
    <>
      <SideSlider
        renderAsModal
        isOpen={isOpen}
      >
        <ScrollablePageLayout
          pageId={pageId}
          activeStatus={isOpen}
          header={
            <PageHeader
              closeButton
              closeButtonAction={() => setIsOpen(false)}
              closeButtonIcon={arrowBackOutline}
              title={`${i18n.t("connectdapp.tabheader")}`}
              additionalButtons={
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
              }
            />
          }
        >
          <div className="connect-wallet-container">
            {connections.length > 0 ? (
              <>
                <h2 className="connect-wallet-title">
                  {i18n.t("connectdapp.connectionhistory.title")}
                </h2>
                <CardList
                  data={displayConnection}
                  onCardClick={handleOpenConfirmConnectModal}
                  onRenderCardAction={(data) => {
                    return (
                      <IonItemOption
                        color="danger"
                        data-testid={`delete-connections-${data.meerkatId}`}
                        onClick={() => {
                          handleOpenDeleteAlert(data);
                        }}
                      >
                        {i18n.t("connectdapp.connectionhistory.action.delete")}
                      </IonItemOption>
                    );
                  }}
                  onRenderEndSlot={(data) => {
                    if (data.meerkatId === pendingConnection?.meerkatId) {
                      return (
                        <IonChip className="connection-pending">
                          <IonIcon
                            icon={hourglassOutline}
                            color="primary"
                          ></IonIcon>
                        </IonChip>
                      );
                    }

                    if (data.meerkatId !== connectedWallet?.meerkatId)
                      return null;

                    return (
                      <IonCheckbox
                        checked={true}
                        aria-label=""
                        className="checkbox"
                        data-testid="connected-wallet-check-mark"
                      />
                    );
                  }}
                />
              </>
            ) : (
              <div className="placeholder-container">
                <CardsPlaceholder
                  buttonLabel={`${i18n.t("connectdapp.connectbtn")}`}
                  buttonAction={handleScanQR}
                  testId={pageId}
                />
              </div>
            )}
          </div>
        </ScrollablePageLayout>
      </SideSlider>
      <ConfirmConnectModal
        isConnectModal={
          actionInfo.data?.meerkatId !== connectedWallet?.meerkatId
        }
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
        isOpen={openExistConenctedWalletAlert}
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
