import { BaseRecord, Tags } from "../../storage/storage.types";
import { CreationStatus } from "../agent.types";

interface GroupMetadata {
  groupId: string;
  groupInitiator: boolean;
  groupCreated: boolean;
  userName: string;
}

interface IdentifierMetadataRecordProps {
  id: string;
  displayName: string;
  creationStatus?: CreationStatus;
  createdAt?: Date;
  isDeleted?: boolean;
  theme: number;
  groupMemberPre?: string;
  groupMetadata?: GroupMetadata;
  pendingDeletion?: boolean;
  sxlt?: string;
  tags?: Tags;
}

class IdentifierMetadataRecord extends BaseRecord {
  displayName!: string;
  theme!: number;
  creationStatus!: CreationStatus;
  isDeleted!: boolean;
  pendingDeletion!: boolean;
  groupMemberPre?: string;
  groupMetadata?: GroupMetadata;
  sxlt?: string;

  static readonly type = "IdentifierMetadataRecord";
  readonly type = IdentifierMetadataRecord.type;

  constructor(props: IdentifierMetadataRecordProps) {
    super();

    if (props) {
      this.id = props.id;
      this.displayName = props.displayName;
      this.createdAt = props.createdAt ?? new Date();
      this.theme = props.theme;
      this.creationStatus = props.creationStatus ?? CreationStatus.PENDING;
      this.isDeleted = props.isDeleted ?? false;
      this.groupMetadata = props.groupMetadata;
      this.groupMemberPre = props.groupMemberPre;
      this.pendingDeletion = props.pendingDeletion ?? false;
      this.sxlt = props.sxlt;
      this._tags = props.tags ?? {};
    }
  }

  getTags() {
    return {
      ...this._tags,
      groupId: this.groupMetadata?.groupId,
      isDeleted: this.isDeleted,
      creationStatus: this.creationStatus,
      groupCreated: this.groupMetadata?.groupCreated,
      pendingDeletion: this.pendingDeletion,
    };
  }
}

export type { IdentifierMetadataRecordProps };
export { IdentifierMetadataRecord };
