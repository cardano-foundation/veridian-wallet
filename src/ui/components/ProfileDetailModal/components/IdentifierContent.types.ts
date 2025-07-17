import { IdentifierDetails } from "../../../../core/agent/services/identifier.types";

interface IdentifierContentProps {
  oobi: string;
  cardData: IdentifierDetails;
  onRotateKey: () => void;
  setCardData: (value: IdentifierDetails) => void;
}

interface ProfileInformationProps {
  value: string;
  text: string;
}

export type { IdentifierContentProps, ProfileInformationProps };
