import { IonChip, IonIcon } from "@ionic/react";
import { hourglassOutline } from "ionicons/icons";
import {
  ConnectionShortDetails,
  ConnectionStatus,
} from "../../../../core/agent/agent.types";
import { CardList } from "../../../components/CardList";
import { formatShortDate } from "../../../utils/formatters";

const AlphabeticList = ({
  items,
  handleShowConnectionDetails,
}: {
  items: ConnectionShortDetails[];
  handleShowConnectionDetails: (item: ConnectionShortDetails) => void;
}) => {
  const displayConnection = items.map((connection) => ({
    id: connection.id,
    title: connection.label as string,
    subtitle: formatShortDate(`${connection?.createdAtUTC}`),
    image: connection.logo,
    data: connection,
  }));

  return (
    <CardList
      onCardClick={handleShowConnectionDetails}
      data={displayConnection}
      onRenderEndSlot={(data) =>
        data.status === ConnectionStatus.PENDING ||
        data.status === ConnectionStatus.FAILED ? (
            <IonChip>
              <IonIcon
                icon={hourglassOutline}
                color="primary"
              ></IonIcon>
              <span>{ConnectionStatus.PENDING}</span>
            </IonChip>
          ) : null
      }
    />
  );
};

export { AlphabeticList };
