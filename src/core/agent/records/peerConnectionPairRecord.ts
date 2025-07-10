import { BaseRecord, Tags } from "../../storage/storage.types";

interface PeerConnectionPairRecordProps {
  id?: string;
  name?: string;
  url?: string;
  createdAt?: Date;
  iconB64?: string;
  selectedAid: string;
  tags?: Tags;
}

class PeerConnectionPairRecord extends BaseRecord {
  name?: string;
  url?: string;
  iconB64?: string;
  selectedAid!: string;

  static readonly type = "peerConnectionPairRecord";
  readonly type = PeerConnectionPairRecord.type;

  constructor(props: PeerConnectionPairRecordProps) {
    super();
    if (props) {
      this.id = `${props.id}:${props.selectedAid}`;
      this.name = props.name;
      this.url = props.url;
      this.createdAt = props.createdAt ?? new Date();
      this.iconB64 = props.iconB64;
      this.selectedAid = props.selectedAid;

      this.setTags({
        ...(props.tags ?? {}),
        selectedAid: props.selectedAid,
      });
    }
  }

  getDappIdentifier() {
    return this.id.split(":")[0];
  }

  getIdentifier() {
    return this.id.split(":")[1];
  }

  getTags() {
    return {
      ...this._tags,
    };
  }
}

export type { PeerConnectionPairRecordProps };
export { PeerConnectionPairRecord };
