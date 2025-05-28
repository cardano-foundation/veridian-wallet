import { useCallback } from "react";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { IpexCommunicationService } from "../../../core/agent/services/ipexCommunicationService";
import BackgroundRome from "../../assets/images/rome-bg.png";
import { CardType } from "../../globals/types";
import { formatShortDate } from "../../utils/formatters";
import { getTheme } from "../../utils/theme";
import { CardList as BaseCardList, CardItem } from "../CardList";
import { CardTheme } from "../CardTheme";
import "./SwitchCardView.scss";
import { CardListProps } from "./SwitchCardView.types";

const CardList = ({
  cardsData,
  cardTypes,
  testId,
  onCardClick,
}: CardListProps) => {
  const cardListData = cardsData.map(
    (item): CardItem<IdentifierShortDetails | CredentialShortDetails> => {
      if (cardTypes === CardType.IDENTIFIERS) {
        const identifier = item as IdentifierShortDetails;

        return {
          id: item.id,
          title: identifier.displayName,
          subtitle: formatShortDate(identifier.createdAtUTC),
          data: identifier,
        };
      }

      const cred = item as CredentialShortDetails;
      return {
        id: item.id,
        title: cred.credentialType,
        subtitle: formatShortDate(cred.issuanceDate),
        data: cred,
      };
    }
  );

  const renderStartSlot = useCallback(
    (data: IdentifierShortDetails | CredentialShortDetails) => {
      if (cardTypes === CardType.CREDENTIALS) {
        const card = data as CredentialShortDetails;

        return card.schema == IpexCommunicationService.SCHEMA_SAID_ROME_DEMO ? (
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
      }

      return (
        <CardTheme
          {...getTheme((data as IdentifierShortDetails).theme)}
          className="card-logo"
        />
      );
    },
    [cardTypes]
  );

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
