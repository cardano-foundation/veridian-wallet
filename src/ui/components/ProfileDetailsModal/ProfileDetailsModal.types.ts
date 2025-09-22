import { HardwareBackButtonConfig } from "../PageHeader/PageHeader.types";

interface ProfileDetailsModalProps {
  pageId: string;
  profileId: string;
  onClose?: (animation?: boolean) => void;
  hardwareBackButtonConfig?: HardwareBackButtonConfig;
  restrictedOptions?: boolean;
}

interface ProfileDetailsModuleProps extends ProfileDetailsModalProps {
  setIsOpen: (value: boolean) => void;
  setShowConfirmation: (value: boolean) => void;
  confirmConnection: boolean;
  setConfirmConnection: (value: boolean) => void;
  scannedValue: string;
  onScanFinish: (content: string) => void;
  onConnectionComplete: () => void;
}

interface IdentifierDetailModalProps
  extends Omit<ProfileDetailsModalProps, "navAnimation"> {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export type {
  IdentifierDetailModalProps,
  ProfileDetailsModalProps,
  ProfileDetailsModuleProps,
};
