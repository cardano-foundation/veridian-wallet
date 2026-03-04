import { IonButton, IonChip, IonIcon } from "@ionic/react";
import {
  checkmark,
  copyOutline,
  hourglassOutline,
  personCircleOutline,
  trashOutline,
} from "ionicons/icons";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { getPendingDAppConnection } from "../../../../../store/reducers/profileCache";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
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
  const pendingDAppConnection = useAppSelector(getPendingDAppConnection);

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

  const isConnectingToDApp =
    !!pendingDAppConnection &&
    pendingDAppConnection.meerkatId === connectionData?.meerkatId;
  const dAppName = !connectionData?.name
    ? ellipsisText(connectionData?.meerkatId || "", 25)
    : connectionData?.name;

  const buttonTitle = i18n.t(
    isConnectingToDApp
      ? "connectdapp.connectionhistory.confirmconnect.connectingbtn"
      : isConnectModal
      ? "connectdapp.connectionhistory.confirmconnect.connectbtn"
      : "connectdapp.connectionhistory.confirmconnect.disconnectbtn"
  );

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
    "tertiary-button": !isConnectModal,
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
          "connectdapp.connectionhistory.confirmconnect.done"
        )}`,
        actionButton: true,
        actionButtonIcon: trashOutline,
        actionButtonAction: deleteConnection,
      }}
    >
      <div className="logo-container">
        {cardImg}
        {!isConnectModal && (
          <div className="check-mark">
            <IonIcon
              slot="icon-only"
              icon={checkmark}
            />
          </div>
        )}
      </div>
      <h3
        data-testid="connect-wallet-title"
        className={combineClassNames("confirm-modal-name-title", {
          "pending-title": !connectionData?.name,
        })}
      >
        {dAppName}
      </h3>
      {!isConnectingToDApp && (
        <p
          data-testid="connect-wallet-indetifier-name"
          className="confirm-modal-name"
        >
          {connectionData?.url}
        </p>
      )}
      {!isConnectingToDApp && connectionData?.name && (
        <IonButton
          onClick={() => {
            if (!connectionData?.meerkatId) return;
            writeToClipboard(connectionData.meerkatId as string);
            dispatch(setToastMsg(ToastMsgType.COPIED_TO_CLIPBOARD));
          }}
          fill="outline"
          data-testid="connection-id"
          className="confirm-modal-id secondary-button"
        >
          <IonIcon icon={copyOutline} />
          <span>
            {i18n.t("connectdapp.connectionhistory.confirmconnect.copyid")}
          </span>
        </IonButton>
      )}
      {isConnectingToDApp && (
        <IonChip className="pending-chip">
          <IonIcon
            data-testid="pending-chip"
            icon={hourglassOutline}
            color="primary"
          ></IonIcon>
          <span>
            {i18n.t("connectdapp.connectionhistory.confirmconnect.pending")}
          </span>
        </IonChip>
      )}
      <IonButton
        disabled={isConnectingToDApp}
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
