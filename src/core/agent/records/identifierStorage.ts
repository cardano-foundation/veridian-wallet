import { StorageService } from "../../storage/storage.types";
import {
  IdentifierMetadataRecord,
  IdentifierMetadataRecordProps,
} from "./identifierMetadataRecord";

class IdentifierStorage {
  static readonly IDENTIFIER_METADATA_RECORD_MISSING =
    "Identifier metadata record does not exist";
  private storageService: StorageService<IdentifierMetadataRecord>;

  constructor(storageService: StorageService<IdentifierMetadataRecord>) {
    this.storageService = storageService;
  }

  async getIdentifierMetadata(id: string): Promise<IdentifierMetadataRecord> {
    const metadata = await this.storageService.findById(
      id,
      IdentifierMetadataRecord
    );
    if (!metadata) {
      throw new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING);
    }
    return metadata;
  }

  async getUserFacingIdentifierRecords(): Promise<IdentifierMetadataRecord[]> {
    return await this.storageService.findAllByQuery(
      {
        isDeleted: false,
        pendingDeletion: false,
        $not: {
          groupCreated: true,
        },
      },
      IdentifierMetadataRecord
    );
  }

  async getIdentifierRecords(): Promise<IdentifierMetadataRecord[]> {
    return await this.storageService.findAllByQuery(
      {
        isDeleted: false,
        pendingDeletion: false,
      },
      IdentifierMetadataRecord
    );
  }

  async getIdentifiersPendingDeletion(): Promise<IdentifierMetadataRecord[]> {
    return this.storageService.findAllByQuery(
      {
        pendingDeletion: true,
      },
      IdentifierMetadataRecord
    );
  }

  async getAllIdentifiers(): Promise<IdentifierMetadataRecord[]> {
    return this.storageService.getAll(IdentifierMetadataRecord);
  }

  async updateIdentifierMetadata(
    id: string,
    metadata: Partial<
      Pick<
        IdentifierMetadataRecord,
        | "displayName"
        | "theme"
        | "creationStatus"
        | "isDeleted"
        | "groupMetadata"
        | "pendingDeletion"
      >
    >
  ): Promise<void> {
    const identifierMetadataRecord = await this.getIdentifierMetadata(id);
    if (metadata.displayName !== undefined)
      identifierMetadataRecord.displayName = metadata.displayName;
    if (metadata.theme !== undefined)
      identifierMetadataRecord.theme = metadata.theme;
    if (metadata.creationStatus !== undefined)
      identifierMetadataRecord.creationStatus = metadata.creationStatus;
    if (metadata.isDeleted !== undefined)
      identifierMetadataRecord.isDeleted = metadata.isDeleted;
    if (metadata.groupMetadata !== undefined)
      identifierMetadataRecord.groupMetadata = metadata.groupMetadata;
    if (metadata.pendingDeletion !== undefined)
      identifierMetadataRecord.pendingDeletion = metadata.pendingDeletion;
    await this.storageService.update(identifierMetadataRecord);
  }

  async createIdentifierMetadataRecord(
    data: IdentifierMetadataRecordProps
  ): Promise<void> {
    const record = new IdentifierMetadataRecord(data);
    await this.storageService.save(record);
  }

  async getIdentifierMetadataByGroupId(
    groupId: string
  ): Promise<IdentifierMetadataRecord | null> {
    const records = await this.storageService.findAllByQuery(
      {
        isDeleted: false,
        pendingDeletion: false,
        groupId,
      },
      IdentifierMetadataRecord
    );
    if (records.length > 0) {
      return records[0];
    }
    return null;
  }

  async deleteIdentifierMetadata(id: string): Promise<void> {
    await this.storageService.deleteById(id);
  }
}

export { IdentifierStorage };
