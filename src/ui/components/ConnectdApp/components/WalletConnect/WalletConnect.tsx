import { IonIcon } from "@ionic/react";
import { personCircleOutline } from "ionicons/icons";
import { useState } from "react";
import { PeerConnection } from "../../../../../core/cardano/walletConnect/peerConnection";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import {
  getDefaultProfile,
  setCurrentOperation,
} from "../../../../../store/reducers/stateCache";
import {
  getPendingConnection,
  getWalletConnectionsCache,
  setIsConnecting,
  setPendingConnection,
  setWalletConnectionsCache,
} from "../../../../../store/reducers/walletConnectionsCache";
import { OperationType, ToastMsgType } from "../../../../globals/types";
import { showError } from "../../../../utils/error";
import { combineClassNames } from "../../../../utils/style";
import { Alert } from "../../../Alert";
import { ResponsivePageLayout } from "../../../layout/ResponsivePageLayout";
import { PageFooter } from "../../../PageFooter";
import { PageHeader } from "../../../PageHeader";
import { SidePageContentProps } from "../../../SidePage/SidePage.types";
import { ANIMATION_DURATION } from "../../../SideSlider/SideSlider.types";
import "./WalletConnect.scss";

const WalletConnect = ({ setOpenPage }: SidePageContentProps) => {
  const pendingConnection = useAppSelector(getPendingConnection);
  const dispatch = useAppDispatch();
  const defaultProfile = useAppSelector(getDefaultProfile);
  const [openDeclineAlert, setOpenDeclineAlert] = useState(false);
  const [startingMeerkat, setStartingMeerkat] = useState<boolean>(false);
  const existingConnections = useAppSelector(getWalletConnectionsCache);

  const classes = combineClassNames({
    show: !!pendingConnection,
    hide: !pendingConnection,
  });

  const openDecline = () => {
    setOpenDeclineAlert(true);
  };

  if (!pendingConnection) return null;

  const handleClose = () => {
    setOpenPage(false);

    setTimeout(() => {
      dispatch(setPendingConnection(null));
    }, ANIMATION_DURATION);
  };

  const handleAccept = async () => {
    try {
      if (!startingMeerkat) {
        const pendingDAppMeerkat = pendingConnection.id;
        setStartingMeerkat(true);
        await PeerConnection.peerConnection.start(defaultProfile);
        await PeerConnection.peerConnection.connectWithDApp(pendingDAppMeerkat);
        const existingConnection = existingConnections.find(
          (connection) => connection.id === pendingDAppMeerkat
        );
        if (existingConnection) {
          const updatedConnections = [];
          for (const connection of existingConnections) {
            if (connection.id === existingConnection.id) {
              updatedConnections.push({
                ...existingConnection,
                selectedAid: defaultProfile,
              });
            } else {
              updatedConnections.push(connection);
            }
          }
          dispatch(setWalletConnectionsCache(updatedConnections));
        } else {
          dispatch(
            setWalletConnectionsCache([
              ...existingConnections,
              { id: pendingDAppMeerkat, selectedAid: defaultProfile },
            ])
          );
        }

        dispatch(setIsConnecting(true));
        dispatch(
          setCurrentOperation(OperationType.OPEN_WALLET_CONNECTION_DETAIL)
        );
        setOpenPage(false);
      }
    } catch (e) {
      showError(
        "Unable to connect wallet",
        e,
        dispatch,
        ToastMsgType.UNABLE_CONNECT_WALLET
      );
    } finally {
      setStartingMeerkat(false);
    }
  };

  const declineAlertClose = () => setOpenDeclineAlert(false);

  return (
    <>
      <ResponsivePageLayout
        pageId="connect-wallet-stage-one"
        activeStatus={!!pendingConnection}
        customClass={classes}
        header={
          <PageHeader
            title={`${i18n.t("connectdapp.request.stageone.title")}`}
            closeButton
            closeButtonLabel={`${i18n.t("connectdapp.request.button.back")}`}
            closeButtonAction={openDecline}
          />
        }
      >
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
      </ResponsivePageLayout>
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
