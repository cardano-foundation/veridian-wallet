import { HardwareBackButtonConfig } from "../PageHeader/PageHeader.types";

interface ProfileDetailsModalProps {
  pageId: string;
  profileId: string;
  onClose?: (animation?: boolean) => void;
  hardwareBackButtonConfig?: HardwareBackButtonConfig;
  restrictedOptions?: boolean;
}

interface IdentifierDetailModalProps
  extends Omit<ProfileDetailsModalProps, "navAnimation"> {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export type { IdentifierDetailModalProps, ProfileDetailsModalProps };
