interface IdentifierDetailModalProps {
  pageId: string;
  profileId: string;
  restrictedOptions?: boolean;
  showProfiles?: (value: boolean) => void;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export type { IdentifierDetailModalProps };
