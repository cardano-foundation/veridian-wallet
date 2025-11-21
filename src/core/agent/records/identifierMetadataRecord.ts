import { BaseRecord, Tags } from "../../storage/storage.types";
import { CreationStatus } from "../agent.types";

interface GroupMetadata {
  groupId: string;
  groupInitiator: boolean;
  groupCreated: boolean;
  proposedUsername: string;
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
  groupUsername?: string;
  pendingDeletion?: boolean;
  pendingUpdate?: boolean;
  sxlt?: string;
  tags?: Tags;
}

class IdentifierMetadataRecord extends BaseRecord {
  displayName!: string;
  theme!: number;
  creationStatus!: CreationStatus;
  isDeleted!: boolean;
  pendingDeletion!: boolean;
  pendingUpdate!: boolean;
  groupMemberPre?: string;
  groupMetadata?: GroupMetadata;
  groupUsername?: string;
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
      this.groupUsername = props.groupUsername;
      this.pendingDeletion = props.pendingDeletion ?? false;
      this.pendingUpdate = props.pendingUpdate ?? false;
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
      pendingUpdate: this.pendingUpdate,
    };
  }
}

export type { IdentifierMetadataRecordProps };
export { IdentifierMetadataRecord };
