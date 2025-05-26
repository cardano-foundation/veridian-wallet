import { BaseRecord, Tags } from "../../storage/storage.types";
import { NotificationRoute } from "../services/keriaNotificationService.types";
import { LinkedRequest } from "./notificationRecord.types";

interface NotificationRecordStorageProps {
  id: string;
  createdAt: Date;
  tags?: Tags;
  a: Record<string, unknown>;
  route: NotificationRoute;
  read: boolean;
  connectionId: string;
  receivingPre: string;
  linkedRequest?: LinkedRequest;
  hidden?: boolean;
  credentialId?: string;
  groupReplied?: boolean;
  groupInitiatorPre?: string;
  groupInitiator?: boolean;
}

class NotificationRecord extends BaseRecord {
  a!: Record<string, unknown>;
  route!: NotificationRoute;
  read!: boolean;
  hidden!: boolean; // Hide from UI but don't delete (used for reliability while recovering IPEX long running operations)
  connectionId!: string;
  receivingPre!: string;
  linkedRequest!: LinkedRequest;
  credentialId?: string;
  groupReplied?: boolean;
  groupInitiatorPre?: string;
  groupInitiator?: boolean;

  static readonly type = "NotificationRecord";
  readonly type = NotificationRecord.type;

  constructor(props: NotificationRecordStorageProps) {
    super();
    if (props) {
      this.id = props.id;
      this.createdAt = props.createdAt;
      this._tags = props.tags ?? {};
      this.a = props.a;
      this.route = props.route;
      this.read = props.read;
      this.hidden = props.hidden ?? false;
      this.connectionId = props.connectionId;
      this.receivingPre = props.receivingPre;
      this.linkedRequest = props.linkedRequest ?? { accepted: false };
      this.credentialId = props.credentialId;
      this.groupReplied = props.groupReplied;
      this.groupInitiatorPre = props.groupInitiatorPre;
      this.groupInitiator = props.groupInitiator;
    }
  }

  getTags() {
    return {
      ...this._tags,
      route: this.route,
      exnSaid: this.a.d,
      receivingPre: this.receivingPre,
      credentialId: this.credentialId,
      currentLinkedRequest: this.linkedRequest.current,
      hidden: this.hidden,
    };
  }
}

export type { NotificationRecordStorageProps };
export { NotificationRecord };
