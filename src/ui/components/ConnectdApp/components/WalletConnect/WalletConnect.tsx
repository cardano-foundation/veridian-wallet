import { IonIcon } from "@ionic/react";
import { personCircleOutline } from "ionicons/icons";
import { useState } from "react";
import { PeerConnection } from "../../../../../core/cardano/walletConnect/peerConnection";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import {
  getCurrentProfile,
  getPeerConnections,
  getPendingDAppConnection,
  setIsConnectingToDApp,
  setPeerConnections,
  setPendingDAppConnection,
} from "../../../../../store/reducers/profileCache";
import { ToastMsgType } from "../../../../globals/types";
import { showError } from "../../../../utils/error";
import { Alert } from "../../../Alert";
import { PageFooter } from "../../../PageFooter";
import { ANIMATION_DURATION } from "../../../SideSlider/SideSlider.types";
import { Step } from "../../ConnectdApp.types";
import "./WalletConnect.scss";
import { WalletConnectProps } from "./WalletConnect.types";

const WalletConnect = ({ close, handleAfterConnect }: WalletConnectProps) => {
  const pendingDAppConnection = useAppSelector(getPendingDAppConnection);
  const dispatch = useAppDispatch();
  const defaultProfile = useAppSelector(getCurrentProfile);
  const [openDeclineAlert, setOpenDeclineAlert] = useState(false);
  const existingConnections = useAppSelector(getPeerConnections);

  const openDecline = () => {
    setOpenDeclineAlert(true);
  };

  if (!pendingDAppConnection) return null;

  const handleClose = () => {
    close(Step.Scan);

    setTimeout(() => {
      dispatch(setPendingDAppConnection(null));
      dispatch(setIsConnectingToDApp(false));
    }, ANIMATION_DURATION);
  };

  const handleAccept = async () => {
    if (!defaultProfile) return;
    const pendingDAppMeerkat = pendingDAppConnection.meerkatId;
    const peerConnectionId = `${pendingDAppMeerkat}:${defaultProfile.identity.id}`;

    try {
      await PeerConnection.peerConnection.start(defaultProfile.identity.id);
      await PeerConnection.peerConnection.connectWithDApp(peerConnectionId);
      const existingConnection = existingConnections.find(
        (connection) =>
          `${connection.meerkatId}:${connection.selectedAid}` ===
          peerConnectionId
      );
      if (existingConnection) {
        const updatedConnections = [];
        for (const connection of existingConnections) {
          if (connection.meerkatId === existingConnection.meerkatId) {
            updatedConnections.push({
              ...existingConnection,
              selectedAid: defaultProfile.identity.id,
            });
          } else {
            updatedConnections.push(connection);
          }
        }
        dispatch(setPeerConnections(updatedConnections));
      } else {
        dispatch(
          setPeerConnections([
            ...existingConnections,
            {
              meerkatId: pendingDAppMeerkat,
              selectedAid: defaultProfile.identity.id,
            },
          ])
        );
      }

      dispatch(setIsConnectingToDApp(true));
      handleAfterConnect?.();
    } catch (e) {
      showError(
        "Unable to connect wallet",
        e,
        dispatch,
        ToastMsgType.UNABLE_CONNECT_WALLET
      );
    }
  };

  const declineAlertClose = () => setOpenDeclineAlert(false);

  return (
    <>
      <div className="connect-wallet-stage-one">
        <div className="request-animation-center">
          <div className="request-icons-row">
            <div className="request-user-logo">
              <IonIcon
                icon={personCircleOutline}
                color="light"
              />
            </div>
          </div>
          <p
            data-testid="wallet-connect-message"
            className="wallet-connect-message"
          >
            {i18n.t("connectdapp.request.stageone.message")}
          </p>
        </div>
        <PageFooter
          customClass="request-footer"
          pageId="connect-wallet-stage-one"
          primaryButtonText={`${i18n.t("connectdapp.request.button.accept")}`}
          primaryButtonAction={handleAccept}
          declineButtonText={`${i18n.t("connectdapp.request.button.decline")}`}
          declineButtonAction={openDecline}
        />
      </div>
      <Alert
        isOpen={openDeclineAlert}
        setIsOpen={setOpenDeclineAlert}
        dataTestId="alert-decline-connect"
        headerText={i18n.t("connectdapp.request.stageone.alert.titleconfirm")}
        confirmButtonText={`${i18n.t(
          "connectdapp.request.stageone.alert.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "connectdapp.request.stageone.alert.cancel"
        )}`}
        actionConfirm={handleClose}
        actionCancel={declineAlertClose}
        actionDismiss={declineAlertClose}
      />
    </>
  );
};

export { WalletConnect };
