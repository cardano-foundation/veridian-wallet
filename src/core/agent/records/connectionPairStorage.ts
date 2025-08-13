import { StorageService, Query } from "../../storage/storage.types";
import {
  ConnectionPairRecord,
  ConnectionPairRecordStorageProps,
} from "./connectionPairRecord";

export class ConnectionPairStorage {
  private storageService: StorageService<ConnectionPairRecord>;

  constructor(storageService: StorageService<ConnectionPairRecord>) {
    this.storageService = storageService;
  }

  save(props: ConnectionPairRecordStorageProps): Promise<ConnectionPairRecord> {
    const record = new ConnectionPairRecord(props);
    return this.storageService.save(record);
  }

  delete(record: ConnectionPairRecord): Promise<void> {
    return this.storageService.delete(record);
  }

  deleteById(id: string): Promise<void> {
    return this.storageService.deleteById(id);
  }

  update(record: ConnectionPairRecord): Promise<void> {
    return this.storageService.update(record);
  }

  findById(id: string): Promise<ConnectionPairRecord | null> {
    return this.storageService.findById(id, ConnectionPairRecord);
  }

  findAllByQuery(query: Query<ConnectionPairRecord>): Promise<ConnectionPairRecord[]> {
    return this.storageService.findAllByQuery(query, ConnectionPairRecord);
  }

  getAll(): Promise<ConnectionPairRecord[]> {
    return this.storageService.getAll(ConnectionPairRecord);
  }

  findByContactId(contactId: string): Promise<ConnectionPairRecord[]> {
    return this.findAllByQuery({ contactId });
  }

  findByIdentifier(identifier: string): Promise<ConnectionPairRecord[]> {
    return this.findAllByQuery({ identifier });
  }

  findByContactAndIdentifier(
    contactId: string,
    identifier: string
  ): Promise<ConnectionPairRecord[]> {
    return this.findAllByQuery({ contactId, identifier });
  }
}
