import { BaseRecord } from "../../storage/storage.types";

interface PeerConnectionAccountRecordStorageProps {
  id?: string;
  name?: string;
  url?: string;
  createdAt?: Date;
  iconB64?: string;
  selectedAid: string;
}

class PeerConnectionAccountRecord extends BaseRecord {
  name?: string;
  url?: string;
  iconB64?: string;

  static readonly type = "PeerConnectionAccountRecord";
  readonly type = PeerConnectionAccountRecord.type;

  constructor(props: PeerConnectionAccountRecordStorageProps) {
    super();
    if (props) {
      this.id = props.id ?? `${props.id}:${props.selectedAid}`;
      this.name = props.name;
      this.url = props.url;
      this.createdAt = props.createdAt ?? new Date();
      this.iconB64 = props.iconB64;
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

export type { PeerConnectionAccountRecordStorageProps };
export { PeerConnectionAccountRecord };
