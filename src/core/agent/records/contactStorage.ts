import { StorageMessage, StorageService } from "../../storage/storage.types";
import { ContactRecord, ContactRecordStorageProps } from "./contactRecord";

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

  // @TODO - foconnor: Some refactoring should be done to just have an idempotent deleteById
  async deleteByIdIfExists(id: string): Promise<void> {
    try {
      return await this.storageService.deleteById(id);
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          error.message ===
            `${StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG} ${id}`
        )
      ) {
        throw error;
      }
    }
  }

  update(record: ContactRecord): Promise<void> {
    return this.storageService.update(record);
  }

  findById(id: string): Promise<ContactRecord | null> {
    return this.storageService.findById(id, ContactRecord);
  }

  async findExpectedById(id: string): Promise<ContactRecord> {
    const record = await this.findById(id);
    if (!record) {
      throw new Error(StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG);
    }
    return record;
  }

  findAllByQuery(query: Record<string, unknown>): Promise<ContactRecord[]> {
    return this.storageService.findAllByQuery(query, ContactRecord);
  }

  getAll(): Promise<ContactRecord[]> {
    return this.storageService.getAll(ContactRecord);
  }
}
