import { KeriaNotification } from "../../../../../core/agent/services/keriaNotificationService.types";
import { Profile } from "../../../../../store/reducers/profileCache";
import { Member } from "../../../../components/MemberList/MemberList.type";

interface ErrorPageProps {
  pageId: string;
  activeStatus: boolean;
  notificationDetails: KeriaNotification;
  onFinishSetup: () => Promise<void>;
  handleLeaveGroup: () => void;
  multisigExn?: boolean;
  profile: Profile;
  oobi: string;
  groupMembers?: Member[];
}

export type { ErrorPageProps };
