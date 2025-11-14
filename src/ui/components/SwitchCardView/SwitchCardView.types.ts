import { ReactNode } from "react";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";

enum CardListViewType {
  Stack,
  List,
}

interface SwitchCardViewProps {
  title: string;
  cardsData: CredentialShortDetails[];
  hideHeader?: boolean;
  name: string;
  onShowCardDetails?: () => void;
  className?: string;
  filters?: ReactNode;
  placeholder?: ReactNode;
}

interface CardListProps {
  cardsData: CredentialShortDetails[];
  testId?: string;
  onCardClick?: (card: IdentifierShortDetails | CredentialShortDetails) => void;
}

export { CardListViewType };
export type { CardListProps, SwitchCardViewProps };
