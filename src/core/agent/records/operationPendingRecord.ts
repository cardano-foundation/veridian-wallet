import { BaseRecord, Tags } from "../../storage/storage.types";
import { OperationPendingRecordType } from "./operationPendingRecord.type";
import { randomSalt } from "../services/utils";

export interface OperationRetryData {
  attempts: number;
  lastAttempt: number;
  lastError: string;
}

interface OperationPendingRecordStorageProps {
  id?: string;
  createdAt?: Date;
  tags?: Tags;
  recordType: OperationPendingRecordType;
  retryData?: OperationRetryData;
}

class OperationPendingRecord extends BaseRecord {
  recordType!: OperationPendingRecordType;
  retryData?: OperationRetryData;
  static readonly type = "OperationPendingRecord";
  readonly type = OperationPendingRecord.type;

  constructor(props: OperationPendingRecordStorageProps) {
    super();
    if (props) {
      this.id = props.id ?? randomSalt();
      this.createdAt = props.createdAt ?? new Date();
      this.recordType = props.recordType;
      this._tags = props.tags ?? {};
      this.retryData = props.retryData;
    }
  }

  getTags() {
    return {
      ...this._tags,
      recordType: this.recordType,
      retryLastAttempt: this.retryData?.lastAttempt,
    };
  }
}

export type { OperationPendingRecordStorageProps };
export { OperationPendingRecord };
