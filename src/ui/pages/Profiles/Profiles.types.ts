import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";

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

interface ProfileItemsProps {
  identifier?: IdentifierShortDetails;
  onClick?: () => void;
}

export type {
  ProfilesProps,
  OptionButtonProps,
  ProfileItemsProps,
  AvatarProfilesProps,
};
