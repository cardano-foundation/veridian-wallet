import { BackReason } from "../../../../../components/CredentialDetailModule/CredentialDetailModule.types";

interface LightCredentialDetailModalProps {
  credId: string;
  isOpen: boolean;
  defaultSelected: boolean;
  setIsOpen: (value: boolean) => void;
  onClose: (reason: BackReason, isSelected: boolean, id: string) => void;
  viewOnly?: boolean;
}

export type { LightCredentialDetailModalProps };
