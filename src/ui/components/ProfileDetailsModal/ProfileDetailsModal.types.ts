interface IdentifierDetailModalProps {
  pageId: string;
  profileId: string;
  restrictedOptions?: boolean;
  showProfiles?: (value: boolean) => void;
  isOpen: boolean;
  setIsOpen: (value: boolean, closeProfiles?: boolean) => void;
}

export type { IdentifierDetailModalProps };
