interface AvatarProfilesProps {
  defaultProfile: string;
}
interface ProfilesProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

interface OptionButtonProps {
  icon: string;
  text: string;
  disabled?: boolean;
  action: () => void;
}

export type { ProfilesProps, OptionButtonProps, AvatarProfilesProps };
