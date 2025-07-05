import { PeerConnection } from "../../cardano/walletConnect/peerConnection.types";
import { StorageService } from "../../storage/storage.types";
import {
  PeerConnectionMetadataRecord,
  PeerConnectionMetadataRecordProps,
} from "./peerConnectionMetadataRecord";

class PeerConnectionStorage {
  static readonly PEER_CONNECTION_METADATA_RECORD_MISSING =
    "Peer connection metadata record does not exist";
  private storageService: StorageService<PeerConnectionMetadataRecord>;

  constructor(storageService: StorageService<PeerConnectionMetadataRecord>) {
    this.storageService = storageService;
  }

  async getPeerConnectionMetadata(
    id: string
  ): Promise<PeerConnectionMetadataRecord> {
    const metadata = await this.storageService.findById(
      id,
      PeerConnectionMetadataRecord
    );
    if (!metadata) {
      throw new Error(
        PeerConnectionStorage.PEER_CONNECTION_METADATA_RECORD_MISSING
      );
    }
    return metadata;
  }

  async getAllPeerConnectionMetadata(): Promise<PeerConnection[]> {
    const records = await this.storageService.getAll(
      PeerConnectionMetadataRecord
    );
    return records.map((record) => ({
      id: record.id,
      iconB64: record.iconB64,
      name: record.name,
      url: record.url,
      createdAt: record.createdAt.toISOString(),
    }));
  }

  async updatePeerConnectionMetadata(
    id: string,
    metadata: Partial<
      Pick<PeerConnectionMetadataRecord, "name" | "url" | "iconB64">
    >
  ): Promise<void> {
    const identifierMetadataRecord = await this.getPeerConnectionMetadata(id);
    if (metadata.name !== undefined)
      identifierMetadataRecord.name = metadata.name;
    if (metadata.url !== undefined) identifierMetadataRecord.url = metadata.url;
    if (metadata.iconB64 !== undefined)
      identifierMetadataRecord.iconB64 = metadata.iconB64;
    await this.storageService.update(identifierMetadataRecord);
  }

  async createPeerConnectionMetadataRecord(
    data: PeerConnectionMetadataRecordProps
  ): Promise<void> {
    const record = new PeerConnectionMetadataRecord(data);
    await this.storageService.save(record);
  }

  async deletePeerConnectionMetadataRecord(id: string): Promise<void> {
    await this.storageService.deleteById(id);
  }
}

export { PeerConnectionStorage };
