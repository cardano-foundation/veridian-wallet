import { BaseRecord } from "../../storage/storage.types";

interface PeerConnectionMetadataRecordProps {
  id: string;
  name?: string;
  url?: string;
  createdAt?: Date;
  iconB64?: string;
  selectedAid: string;
}

class PeerConnectionMetadataRecord extends BaseRecord {
  name?: string;
  url?: string;
  iconB64?: string;
  selectedAid: string;

  static readonly type = "PeerConnectionMetadataRecord";
  readonly type = PeerConnectionMetadataRecord.type;

  constructor(props: PeerConnectionMetadataRecordProps) {
    super();

    this.id = PeerConnectionMetadataRecord.getCompositeId(
      props.id,
      props.selectedAid
    );
    this.name = props.name ?? "";
    this.url = props.url ?? "";
    this.selectedAid = props.selectedAid;
    this.createdAt = props.createdAt ?? new Date();
    this.iconB64 = props.iconB64 ?? "";
  }

  static getCompositeId(dAppId: string, aid: string): string {
    return `${dAppId}:${aid}`;
  }

  getTags() {
    return {
      ...this._tags,
    };
  }
}

export type { PeerConnectionMetadataRecordProps };
export { PeerConnectionMetadataRecord };
