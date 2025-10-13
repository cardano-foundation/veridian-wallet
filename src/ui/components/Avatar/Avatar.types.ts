interface AvatarProps {
  id: string;
  handleAvatarClick?: () => void;
}

interface MemberAvatarProps {
  rank: number;
  firstLetter: string;
  handleClick?: () => void;
  imageSource?: string;
}

export type { AvatarProps, MemberAvatarProps };
