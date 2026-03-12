import { IdentifierDetails } from "../../../../core/agent/services/identifier.types";

interface ProfileContentProps {
  cardData: IdentifierDetails;
  setCardData: (value: IdentifierDetails) => void;
  onRotateKey: () => void;
  onAfterScan: () => void;
}

interface ProfileInformationProps {
  value: string;
  text: string;
}

export type { ProfileContentProps, ProfileInformationProps };
