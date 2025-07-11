interface ProfilesProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

interface OptionButtonProps {
  icon: string;
  text: string;
  action: () => void;
}

interface ProfileItemsProps {
  id: string;
  onClick?: () => void;
}

export type { ProfilesProps, OptionButtonProps, ProfileItemsProps };
