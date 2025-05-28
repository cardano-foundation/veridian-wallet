import { IonIcon } from "@ionic/react";
import { search } from "ionicons/icons";
import { ConnectionShortDetails } from "../../../../../core/agent/agent.types";
import { i18n } from "../../../../../i18n";
import { CardItem, CardList } from "../../../../components/CardList";
import { ListHeader } from "../../../../components/ListHeader";
import {
  SearchConnectionContentProps,
  SearchConnectionListProps,
} from "../ConnectionsBody/ConnectionsBody.types";
import "./SearchConnectionContent.scss";

const SearchConnectionList = ({
  connections,
  onItemClick,
  testId,
  title,
}: SearchConnectionListProps) => {
  const cardListData = connections.map(
    (connection): CardItem<ConnectionShortDetails> => {
      return {
        id: connection.id,
        title: connection.label,
        image: connection.logo,
        data: connection,
      };
    }
  );

  return (
    <div>
      <ListHeader title={title} />
      <CardList
        className="connections-card-list"
        data={cardListData}
        lines="none"
        onCardClick={onItemClick}
        testId={`${testId}-list`}
      />
    </div>
  );
};

const SearchConnectionContent = ({
  mappedConnections,
  onItemClick,
  keyword,
}: SearchConnectionContentProps) => {
  const connections = mappedConnections.flatMap((item) => {
    return item.value.filter((item) =>
      item.label.toLowerCase().includes(keyword.toLowerCase())
    );
  });

  if (connections.length === 0) {
    return (
      <div
        data-testid="empty-search-connection"
        className="search-connection-content no-result"
      >
        <IonIcon icon={search} />
        <h3>
          {i18n.t("connections.page.search.noresult.title", {
            keyword,
          })}
        </h3>
        <p>{i18n.t("connections.page.search.noresult.text")}</p>
      </div>
    );
  }

  return (
    <div
      data-testid="search-connection"
      className="search-connection-content"
    >
      <SearchConnectionList
        title={`${i18n.t("connections.page.search.connections")}`}
        connections={connections}
        onItemClick={onItemClick}
        testId="connection-search"
      />
    </div>
  );
};

export { SearchConnectionContent };
