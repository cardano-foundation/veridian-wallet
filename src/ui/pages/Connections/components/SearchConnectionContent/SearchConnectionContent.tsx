import { useMemo } from "react";
import { IonIcon } from "@ionic/react";
import { search } from "ionicons/icons";
import { RegularConnectionDetails } from "../../../../../core/agent/agent.types";
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
    (connection): CardItem<RegularConnectionDetails> => {
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
        onCardClick={(item) => onItemClick(item)}
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
  const filteredConnections = useMemo(() => {
    return mappedConnections.flatMap((item) =>
      item.value.filter((connection) =>
        connection.label.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }, [mappedConnections, keyword]);

  if (filteredConnections.length === 0) {
    return (
      <div
        data-testid="empty-search-connection"
        className="search-connection-content no-result"
      >
        <IonIcon icon={search} />
        <h3>
          {i18n.t("tabs.connections.tab.search.noresult.title", {
            keyword,
          })}
        </h3>
        <p>{i18n.t("tabs.connections.tab.search.noresult.text")}</p>
      </div>
    );
  }

  return (
    <div
      data-testid="search-connection"
      className="search-connection-content"
    >
      <SearchConnectionList
        title={`${i18n.t("tabs.connections.tab.search.connections")}`}
        connections={filteredConnections}
        onItemClick={(item) => onItemClick(item)}
        testId="connection-search"
      />
    </div>
  );
};

export { SearchConnectionContent };
