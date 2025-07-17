import { i18n } from "../../../../../i18n";
import { CardBlock, CardDetailsItem } from "../../../CardDetails";
import { ListHeader } from "../../../ListHeader";
import { SigningThresholdProps } from "./IdentifierAttributeDetailModal.types";

export const SigningThreshold = ({ data }: SigningThresholdProps) => {
  return (
    <>
      <ListHeader
        title={i18n.t(
          "profiledetails.detailmodal.signingthreshold.threshold.title"
        )}
      />
      <CardBlock testId="signing-threshold-block">
        <CardDetailsItem
          info={i18n.t(
            "profiledetails.detailmodal.signingthreshold.threshold.text",
            {
              members: data.members?.length || 0,
              threshold: data.kt,
            }
          )}
        />
      </CardBlock>
    </>
  );
};
