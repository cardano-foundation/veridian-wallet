import { keyOutline, informationCircleOutline } from "ionicons/icons";
import { i18n } from "../../../../i18n";
import {
  CardDetailsBlock,
  CardDetailsItem,
  CardDetailsAttributes,
} from "../../../components/CardDetailsElements";
import { ACDCDetails } from "../../../../core/agent/services/credentialService.types";

interface ACDCContentProps {
  cardData: ACDCDetails;
}

const CredContentAcdc = ({ cardData }: ACDCContentProps) => {
  return (
    <div className="card-details-content">
      <CardDetailsBlock title={i18n.t("creds.card.details.title")}>
        <CardDetailsItem
          info={cardData.credentialType}
          icon={informationCircleOutline}
          testId="card-details-credential-type"
        />
      </CardDetailsBlock>
      <CardDetailsBlock title={i18n.t("creds.card.details.description.label")}>
        {i18n.t("creds.card.details.description.content")}
      </CardDetailsBlock>
      {cardData.a && (
        <CardDetailsBlock title={i18n.t("creds.card.details.attributes.label")}>
          <CardDetailsAttributes data={cardData.a as any} />
        </CardDetailsBlock>
      )}
      <CardDetailsBlock title={i18n.t("creds.card.details.schemaversion")}>
        <CardDetailsItem
          info={cardData.s.version}
          icon={informationCircleOutline}
          testId="card-details-schema-version"
        />
      </CardDetailsBlock>
      <CardDetailsBlock title={i18n.t("creds.card.details.issuer")}>
        <CardDetailsItem
          info={cardData.i}
          copyButton={true}
          icon={keyOutline}
          testId="card-details-issuer"
        />
      </CardDetailsBlock>
      <CardDetailsBlock title={i18n.t("creds.card.details.status.label")}>
        <CardDetailsAttributes
          data={cardData.lastStatus as any}
          customType="status"
        />
      </CardDetailsBlock>
    </div>
  );
};

export { CredContentAcdc };
