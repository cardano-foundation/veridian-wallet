import { i18n } from "../../../../../i18n";
import {
  CardBlock,
  CardDetailsContent,
  FlatBorderType,
} from "../../../CardDetails";
import { InfoCard } from "../../../InfoCard";
import { SigningThresholdProps } from "./IdentifierAttributeDetailModal.types";

export const SignersDetails = ({ data }: SigningThresholdProps) => {
  return (
    <>
      <CardBlock
        title={i18n.t("profiledetails.group.signingkeysthreshold.title")}
        flatBorder={FlatBorderType.BOT}
      >
        <CardDetailsContent
          mainContent={`${i18n.t(
            Number(data.kt) === 1
              ? "profiledetails.group.signingkeysthreshold.member"
              : "profiledetails.group.signingkeysthreshold.members",
            { member: data.kt }
          )}`}
        />
      </CardBlock>
      <CardBlock
        title={i18n.t("profiledetails.group.rotationthreshold.title")}
        flatBorder={FlatBorderType.TOP}
      >
        <CardDetailsContent
          mainContent={`${i18n.t(
            Number(data.nt) === 1
              ? "profiledetails.group.rotationthreshold.member"
              : "profiledetails.group.rotationthreshold.members",
            { member: data.nt }
          )}`}
        />
      </CardBlock>
      <div className="attribute-description">
        <h3>
          {i18n.t(
            `profiledetails.detailsmodal.signingthreshold.threshold.recovery.explaintitle`
          )}
        </h3>
      </div>
      <InfoCard
        className="attribute-description-content"
        content={i18n.t(
          `profiledetails.detailsmodal.signingthreshold.threshold.recovery.explain`
        )}
      />
    </>
  );
};
