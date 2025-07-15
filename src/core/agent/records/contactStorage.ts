import { StorageService } from "../../storage/storage.types";
import {
  ContactRecord,
  ContactRecordStorageProps,
} from "./contactRecord";

export class ContactStorage {
  private storageService: StorageService<ContactRecord>;

  constructor(storageService: StorageService<ContactRecord>) {
    this.storageService = storageService;
  }

  save(props: ContactRecordStorageProps): Promise<ContactRecord> {
    const record = new ContactRecord(props);
    return this.storageService.save(record);
  }

  delete(record: ContactRecord): Promise<void> {
    return this.storageService.delete(record);
  }

  deleteById(id: string): Promise<void> {
    return this.storageService.deleteById(id);
  }

  update(record: ContactRecord): Promise<void> {
    return this.storageService.update(record);
  }

  findById(id: string): Promise<ContactRecord | null> {
    return this.storageService.findById(id, ContactRecord);
  }

  findAllByQuery(query: any): Promise<ContactRecord[]> {
    return this.storageService.findAllByQuery(query, ContactRecord);
  }

  getAll(): Promise<ContactRecord[]> {
    return this.storageService.getAll(ContactRecord);
  }
} 