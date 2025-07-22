import { BaseRecord, Tags } from "../../storage/storage.types";
import { randomSalt } from "../services/utils";

interface ContactRecordStorageProps {
  id?: string;
  createdAt?: Date;
  tags?: Tags;
  alias: string;
  oobi: string;
  groupId?: string;
}

class ContactRecord extends BaseRecord {
  alias!: string;
  oobi!: string;
  groupId?: string;

  static readonly type = "ContactRecord";
  readonly type = ContactRecord.type;

  constructor(props: ContactRecordStorageProps) {
    super();
    if (props) {
      this.id = props.id ?? randomSalt();
      this.createdAt = props.createdAt ?? new Date();
      this.alias = props.alias;
      this.oobi = props.oobi;
      this.groupId = props.groupId;
      this._tags = props.tags ?? {};
    }
  }

  getTags() {
    return {
      ...this._tags,
      groupId: this.groupId,
    };
  }
}

export type { ContactRecordStorageProps };
export { ContactRecord };
