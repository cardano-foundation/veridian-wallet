import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";

export interface CardsStackProps {
  name: string;
  cardsData: CredentialShortDetails[];
  onShowCardDetails?: () => void;
}
