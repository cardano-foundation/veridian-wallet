import { BaseRecord, Tags } from "../../storage/storage.types";
import { CreationStatus } from "../agent.types";
import { randomSalt } from "../services/utils";

interface ConnectionPairRecordStorageProps {
  id?: string;
  createdAt?: Date;
  tags?: Tags;
  contactId: string;
  accountId: string;
  creationStatus?: CreationStatus;
  pendingDeletion?: boolean;
}

class ConnectionPairRecord extends BaseRecord {
  contactId!: string;
  accountId!: string;
  creationStatus!: CreationStatus;
  pendingDeletion!: boolean;

  static readonly type = "ConnectionPairRecord";
  readonly type = ConnectionPairRecord.type;

  constructor(props: ConnectionPairRecordStorageProps) {
    super();
    if (props) {
      this.id = props.id ?? randomSalt();
      this.createdAt = props.createdAt ?? new Date();
      this.contactId = props.contactId;
      this.accountId = props.accountId;
      this.creationStatus = props.creationStatus ?? CreationStatus.PENDING;
      this.pendingDeletion = props.pendingDeletion ?? false;
      this._tags = props.tags ?? {};
    }
  }

  getTags() {
    return {
      ...this._tags,
      contactId: this.contactId,
      accountId: this.accountId,
      pendingDeletion: this.pendingDeletion,
      creationStatus: this.creationStatus,
    };
  }
}

export type { ConnectionPairRecordStorageProps };
export { ConnectionPairRecord }; 