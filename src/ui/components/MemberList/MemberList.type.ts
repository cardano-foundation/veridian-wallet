import { ReactNode } from "react";

enum MemberAcceptStatus {
  Accepted,
  Waiting,
  Rejected,
  None,
}

interface Member {
  name: string;
  avatar?: ReactNode;
  isCurrentUser: boolean;
  status: MemberAcceptStatus;
}

interface MemberListProps {
  members: Member[];
  bottomText?: string;
  mask?: boolean;
  fullText?: boolean;
}

export { MemberAcceptStatus };
export type { Member, MemberListProps };
