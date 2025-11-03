import { IonCheckbox, IonChip, IonIcon, IonItemOption } from "@ionic/react";
import { hourglassOutline } from "ionicons/icons";
import { i18n } from "../../../../../i18n";
import { useAppSelector } from "../../../../../store/hooks";
import {
  getConnectedDApp,
  getPeerConnections,
  getPendingDAppConnection,
} from "../../../../../store/reducers/profileCache";
import { CardList } from "../../../CardList";
import { CardsPlaceholder } from "../../../CardsPlaceholder";
import { ConnectionsProps } from "./Connections.types";

const Connections = ({
  pageId,
  onCardClick,
  handleDelete,
  handleScanQR,
}: ConnectionsProps) => {
  const connections = useAppSelector(getPeerConnections);
  const pendingConnection = useAppSelector(getPendingDAppConnection);
  const connectedDApp = useAppSelector(getConnectedDApp);

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

  return (
    <div className="connect-wallet-container">
      {connections.length > 0 ? (
        <>
          <h2 className="connect-wallet-title">
            {i18n.t("connectdapp.connectionhistory.title")}
          </h2>
          <CardList
            data={displayConnection}
            onCardClick={onCardClick}
            onRenderCardAction={(data) => {
              return (
                <IonItemOption
                  color="danger"
                  data-testid={`delete-connections-${data.meerkatId}`}
                  onClick={() => {
                    handleDelete(data);
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

              if (data.meerkatId !== connectedDApp?.meerkatId) return null;

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
  );
};

export { Connections };
