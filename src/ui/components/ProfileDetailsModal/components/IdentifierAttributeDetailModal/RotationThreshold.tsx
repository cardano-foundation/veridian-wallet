import { i18n } from "../../../../../i18n";
import { CardBlock, CardDetailsItem } from "../../../CardDetails";
import { ListHeader } from "../../../ListHeader";
import { SigningThresholdProps } from "./IdentifierAttributeDetailModal.types";

const RotationThreshold = ({ data }: SigningThresholdProps) => {
  return (
    <>
      <ListHeader
        title={i18n.t(
          "profiledetails.detailsmodal.rotationthreshold.threshold.title"
        )}
      />
      <CardBlock testId="threshhold-block">
        <CardDetailsItem
          info={i18n.t(
            "profiledetails.detailsmodal.rotationthreshold.threshold.text",
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

export { RotationThreshold };
