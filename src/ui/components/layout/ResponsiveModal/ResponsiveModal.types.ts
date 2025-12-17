import { ReactNode } from "react";

interface ResponsiveModalProps {
  componentId: string;
  modalIsOpen: boolean;
  customClasses?: string;
  children?: ReactNode;
  backdropDismiss?: boolean;
  onDismiss?: () => void;
  onWillDismiss?: () => void;
}

export type { ResponsiveModalProps };
