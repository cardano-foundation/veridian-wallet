import { IonButton, IonChip, IonIcon } from "@ionic/react";
import {
  copyOutline,
  hourglassOutline,
  personCircleOutline,
  trashOutline,
} from "ionicons/icons";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { getPendingConnection } from "../../../../../store/reducers/walletConnectionsCache";
import { OptionModal } from "../../../../components/OptionsModal";
import { ToastMsgType } from "../../../../globals/types";
import { writeToClipboard } from "../../../../utils/clipboard";
import { ellipsisText } from "../../../../utils/formatters";
import { combineClassNames } from "../../../../utils/style";
import "./ConfirmConnectModal.scss";
import { ConfirmConnectModalProps } from "./ConfirmConnectModal.types";

const ConfirmConnectModal = ({
  openModal,
  isConnectModal,
  closeModal,
  onConfirm,
  connectionData,
  onDeleteConnection,
}: ConfirmConnectModalProps) => {
  const dispatch = useAppDispatch();
  const pendingConnection = useAppSelector(getPendingConnection);

  const cardImg = connectionData?.iconB64 ? (
    <img
      src={connectionData.iconB64}
      alt={connectionData.name}
      className="wallet-connect-logo"
      data-testid="wallet-connection-logo"
    />
  ) : (
    <div
      data-testid="wallet-connection-fallback-logo"
      className="wallet-connect-fallback-logo wallet-connect-logo"
    >
      <IonIcon
        icon={personCircleOutline}
        color="light"
      />
    </div>
  );

  const isConnecting =
    !!pendingConnection &&
    pendingConnection.meerkatId === connectionData?.meerkatId;
  const dAppName = !connectionData?.name
    ? ellipsisText(connectionData?.meerkatId || "", 25)
    : connectionData?.name;

  const buttonTitle = i18n.t(
    isConnecting
      ? "tabs.menu.tab.items.connectwallet.connectionhistory.confirmconnect.connectingbtn"
      : isConnectModal
      ? "tabs.menu.tab.items.connectwallet.connectionhistory.confirmconnect.connectbtn"
      : "tabs.menu.tab.items.connectwallet.connectionhistory.confirmconnect.disconnectbtn"
  );

  const meerkatId = connectionData?.meerkatId
    ? connectionData.meerkatId.substring(0, 5) +
      "..." +
      connectionData.meerkatId.slice(-5)
    : "";

  const deleteConnection = () => {
    if (!connectionData) return;

    onDeleteConnection(connectionData);
    closeModal();
  };

  const confirm = () => {
    closeModal();
    onConfirm();
  };

  const confirmClass = combineClassNames("confirm-connect-submit", {
    "primary-button": isConnectModal,
    "secondary-button": !isConnectModal,
  });

  return (
    <OptionModal
      modalIsOpen={openModal}
      componentId="add-connection-modal"
      onDismiss={closeModal}
      customClasses="confirm-connect-modal"
      header={{
        closeButton: true,
        closeButtonAction: closeModal,
        closeButtonLabel: `${i18n.t(
          "tabs.menu.tab.items.connectwallet.connectionhistory.confirmconnect.done"
        )}`,
        actionButton: true,
        actionButtonIcon: trashOutline,
        actionButtonAction: deleteConnection,
      }}
    >
      {cardImg}
      <h3
        data-testid="connect-wallet-title"
        className="confirm-modal-name-title"
      >
        {dAppName}
      </h3>
      {!isConnecting && (
        <p
          data-testid="connect-wallet-indetifier-name"
          className="confirm-modal-name"
        >
          {connectionData?.url}
        </p>
      )}
      {!isConnecting && connectionData?.name && (
        <div
          onClick={() => {
            if (!connectionData?.meerkatId) return;
            writeToClipboard(connectionData.meerkatId as string);
            dispatch(setToastMsg(ToastMsgType.COPIED_TO_CLIPBOARD));
          }}
          className="confirm-modal-id"
          data-testid="connection-id"
        >
          <span>{meerkatId}</span>
          <IonIcon icon={copyOutline} />
        </div>
      )}
      {isConnecting && (
        <IonChip className="pending-chip">
          <IonIcon
            data-testid="pending-chip"
            icon={hourglassOutline}
            color="primary"
          ></IonIcon>
          <span>
            {i18n.t(
              "tabs.menu.tab.items.connectwallet.connectionhistory.confirmconnect.pending"
            )}
          </span>
        </IonChip>
      )}
      <IonButton
        disabled={isConnecting}
        className={confirmClass}
        data-testid="confirm-connect-btn"
        onClick={confirm}
      >
        {buttonTitle}
      </IonButton>
    </OptionModal>
  );
};

export { ConfirmConnectModal };
