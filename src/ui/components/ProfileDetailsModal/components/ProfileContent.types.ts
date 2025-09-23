import { IdentifierDetails } from "../../../../core/agent/services/identifier.types";

interface ProfileContentProps {
  oobi: string;
  cardData: IdentifierDetails;
  onRotateKey: () => void;
  setCardData: (value: IdentifierDetails) => void;
  setIsScanOpen: (value: boolean) => void;
}

interface ProfileInformationProps {
  value: string;
  text: string;
}

export type { ProfileContentProps, ProfileInformationProps };
