import { IdentifierDetails } from "../../../../core/agent/services/identifier.types";

interface ProfileContentProps {
  oobi: string;
  cardData: IdentifierDetails;
  setCardData: (value: IdentifierDetails) => void;
  onRotateKey: () => void;
}

interface ProfileInformationProps {
  value: string;
  text: string;
}

export type { ProfileContentProps, ProfileInformationProps };
