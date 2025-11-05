import {
  CredentialsMatchingApply,
  LinkedGroupInfo,
} from "../../../../../core/agent/services/ipexCommunicationService.types";
import { KeriaNotification } from "../../../../../core/agent/services/keriaNotificationService.types";
import { BackReason } from "../../../../components/CredentialDetailModule/CredentialDetailModule.types";
import { ACDC } from "../../../../../core/agent/services/credentialService.types";

interface MemberInfo {
  aid: string;
  name: string;
  joined: boolean;
  isCurrentUser?: boolean;
}

type LinkedGroup = LinkedGroupInfo & {
  memberInfos: MemberInfo[];
};

interface CredentialRequestProps {
  pageId: string;
  activeStatus: boolean;
  notificationDetails: KeriaNotification;
  credentialRequest: CredentialsMatchingApply;
  linkedGroup: LinkedGroup | null;
  userAID?: string | null;
  onAccept: () => void;
  onBack: () => void;
  onReloadData?: () => Promise<void>;
  suitableCredentialsCount?: number;
}

interface ChooseCredentialProps {
  pageId: string;
  activeStatus: boolean;
  credentialRequest: CredentialsMatchingApply;
  linkedGroup: LinkedGroup | null;
  reloadData: () => void;
  onBack: () => void;
  onSubmit: (credential: RequestCredential) => void;
  notificationDetails: KeriaNotification;
}

interface RequestCredential {
  connectionId: string;
  acdc: ACDC;
}

interface LightCredentialDetailModalProps {
  credId: string;
  isOpen: boolean;
  defaultSelected?: boolean;
  setIsOpen: (value: boolean) => void;
  onClose?: (reason: BackReason, isSelected: boolean, id: string) => void;
  joinedCredRequestMembers?: MemberInfo[];
  viewOnly?: boolean;
}

interface JoinedMemberProps {
  members: MemberInfo[] | null | undefined;
  onClick: () => void;
}

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  credName: string;
  members: MemberInfo[];
  threshold: number;
  joinedMembers: number;
}

export type {
  ChooseCredentialProps,
  CredentialRequestProps,
  JoinedMemberProps,
  LightCredentialDetailModalProps,
  LinkedGroup,
  MemberInfo,
  MembersModalProps,
  RequestCredential,
};
