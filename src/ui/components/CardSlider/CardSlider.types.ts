import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";

interface CardProps {
  name: string;
  index: number;
  cardData: CredentialShortDetails;
  handleShowCardDetails: (index: number) => void;
  pickedCard: number | null;
}

interface CardSliderProps {
  title: string;
  name: string;
  cardsData: CredentialShortDetails[];
  onShowCardDetails?: () => void;
}

export type { CardProps, CardSliderProps };
