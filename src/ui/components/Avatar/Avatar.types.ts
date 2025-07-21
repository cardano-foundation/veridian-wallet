interface AvatarProps {
  id: string;
  handleAvatarClick?: () => void;
}

interface MemberAvatarProps {
  rank: number;
  firstLetter: string;
  handleClick?: () => void;
}

export type { AvatarProps, MemberAvatarProps };
