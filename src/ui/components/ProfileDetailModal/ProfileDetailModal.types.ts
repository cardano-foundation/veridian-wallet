import { HardwareBackButtonConfig } from "../PageHeader/PageHeader.types";

interface ProfileDetailModalProps {
  pageId: string;
  profileId: string;
  onClose?: (animation?: boolean) => void;
  hardwareBackButtonConfig?: HardwareBackButtonConfig;
  restrictedOptions?: boolean;
}

interface IdentifierDetailModalProps
  extends Omit<ProfileDetailModalProps, "navAnimation"> {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export type { IdentifierDetailModalProps, ProfileDetailModalProps };
