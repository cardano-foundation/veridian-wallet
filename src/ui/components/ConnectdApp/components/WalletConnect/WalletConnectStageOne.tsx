import { IonIcon } from "@ionic/react";
import { personCircleOutline } from "ionicons/icons";
import { useState } from "react";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import {
  getWalletConnectionsCache,
  setIsConnecting,
  setPendingConnection,
  setWalletConnectionsCache,
} from "../../../../../store/reducers/walletConnectionsCache";
import { Alert } from "../../../Alert";
import { PageFooter } from "../../../PageFooter";
import { PageHeader } from "../../../PageHeader";
import { ANIMATION_DURATION } from "../../../SideSlider/SideSlider.types";
import { ResponsivePageLayout } from "../../../layout/ResponsivePageLayout";
import { combineClassNames } from "../../../../utils/style";
import "./WalletConnect.scss";
import { WalletConnectStageOneProps } from "./WalletConnect.types";
import {
  getDefaultProfile,
  setCurrentOperation,
} from "../../../../../store/reducers/stateCache";
import { PeerConnection } from "../../../../../core/cardano/walletConnect/peerConnection";
import { OperationType, ToastMsgType } from "../../../../globals/types";
import { showError } from "../../../../utils/error";

const WalletConnectStageOne = ({
  isOpen,
  className,
  onClose,
  pendingDAppMeerkat,
}: WalletConnectStageOneProps) => {
  const dispatch = useAppDispatch();
  const defaultProfile = useAppSelector(getDefaultProfile);
  const [openDeclineAlert, setOpenDeclineAlert] = useState(false);
  const [startingMeerkat, setStartingMeerkat] = useState<boolean>(false);
  const existingConnections = useAppSelector(getWalletConnectionsCache);

  const classes = combineClassNames(className, {
    show: !!isOpen,
    hide: !isOpen,
  });

  const openDecline = () => {
    setOpenDeclineAlert(true);
  };

  const handleClose = () => {
    onClose();

    setTimeout(() => {
      dispatch(setPendingConnection(null));
    }, ANIMATION_DURATION);
  };

  const handleAccept = async () => {
    try {
      if (!startingMeerkat) {
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
      }
      onClose();
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

  return (
    <>
      <ResponsivePageLayout
        pageId="connect-wallet-stage-one"
        activeStatus={isOpen}
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
        actionCancel={() => setOpenDeclineAlert(false)}
        actionDismiss={() => setOpenDeclineAlert(false)}
      />
    </>
  );
};

export { WalletConnectStageOne };
