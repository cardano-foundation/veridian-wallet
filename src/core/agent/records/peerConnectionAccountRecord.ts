import { BaseRecord, Tags } from "../../storage/storage.types";
import { CreationStatus } from "../agent.types";

interface PeerConnectionAccountRecordStorageProps {
  id?: string;
  createdAt?: Date;
  tags?: Tags;
  peerConnectionId: string;
  accountId: string;
  creationStatus?: CreationStatus;
  pendingDeletion?: boolean;
  name?: string;
  url?: string;
  iconB64?: string;
}

class PeerConnectionAccountRecord extends BaseRecord {
  peerConnectionId!: string;
  accountId!: string;
  creationStatus!: CreationStatus;
  pendingDeletion!: boolean;
  name?: string;
  url?: string;
  iconB64?: string;

  static readonly type = "PeerConnectionAccountRecord";
  readonly type = PeerConnectionAccountRecord.type;

  constructor(props: PeerConnectionAccountRecordStorageProps) {
    super();
    if (props) {
      this.id = props.id ?? `${props.peerConnectionId}:${props.accountId}`;
      this.createdAt = props.createdAt ?? new Date();
      this.peerConnectionId = props.peerConnectionId;
      this.accountId = props.accountId;
      this.creationStatus = props.creationStatus ?? CreationStatus.COMPLETE;
      this.pendingDeletion = props.pendingDeletion ?? false;
      this.name = props.name;
      this.url = props.url;
      this.iconB64 = props.iconB64;
      this._tags = props.tags ?? {};
    }
  }

  getTags() {
    return {
      ...this._tags,
      peerConnectionId: this.peerConnectionId,
      accountId: this.accountId,
      pendingDeletion: this.pendingDeletion,
      creationStatus: this.creationStatus,
      name: this.name,
      url: this.url,
      iconB64: this.iconB64,
    };
  }
}

export type { PeerConnectionAccountRecordStorageProps };
export { PeerConnectionAccountRecord };
