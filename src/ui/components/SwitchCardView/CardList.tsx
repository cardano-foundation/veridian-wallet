import { useCallback } from "react";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { IpexCommunicationService } from "../../../core/agent/services/ipexCommunicationService";
import BackgroundRome from "../../assets/images/rome-bg.png";
import { formatShortDate } from "../../utils/formatters";
import { CardList as BaseCardList, CardItem } from "../CardList";
import { CardTheme } from "../CardTheme";
import "./SwitchCardView.scss";
import { CardListProps } from "./SwitchCardView.types";

const CardList = ({ cardsData, testId, onCardClick }: CardListProps) => {
  const cardListData = cardsData.map(
    (item): CardItem<CredentialShortDetails> => {
      const cred = item as CredentialShortDetails;
      return {
        id: item.id,
        title: cred.credentialType,
        subtitle: formatShortDate(cred.issuanceDate),
        data: cred,
      };
    }
  );

  const renderStartSlot = useCallback((data: CredentialShortDetails) => {
    return data.schema == IpexCommunicationService.SCHEMA_SAID_ROME_DEMO ? (
      <img
        src={BackgroundRome}
        alt="rome"
        className="card-logo"
        data-testid="card-logo"
      />
    ) : (
      <CardTheme
        className="card-logo"
        layout={0}
        color={0}
      />
    );
  }, []);

  return (
    <BaseCardList
      className="card-switch-view-list"
      data={cardListData}
      onCardClick={onCardClick}
      rounded={false}
      testId={testId}
      onRenderStartSlot={renderStartSlot}
    />
  );
};

export { CardList };
