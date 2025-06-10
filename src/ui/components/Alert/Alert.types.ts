import { AlertButton } from "@ionic/react";

interface AlertProps {
  isOpen: boolean;
  backdropDismiss?: boolean;
  setIsOpen: (value: boolean) => void;
  dataTestId: string;
  headerText: string;
  subheaderText?: string;
  confirmButtonText?: string;
  secondaryConfirmButtonText?: string;
  cancelButtonText?: string;
  className?: string;
  actionConfirm?: () => void;
  actionSecondaryConfirm?: () => void;
  actionCancel?: () => void;
  actionDismiss?: () => void;
  customButtons?: AlertButton[];
}

export type { AlertProps };
