import { ReactNode } from "react";

interface CardsPlaceholderProps {
  buttonLabel?: string;
  buttonAction?: () => void;
  buttonIcon?: string;
  testId: string;
  children?: ReactNode;
}

export type { CardsPlaceholderProps };
