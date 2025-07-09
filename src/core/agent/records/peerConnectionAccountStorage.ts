import { PeerConnection } from "../../cardano/walletConnect/peerConnection.types";
import { StorageService } from "../../storage/storage.types";
import {
  PeerConnectionAccountRecord,
  PeerConnectionAccountRecordStorageProps,
} from "./peerConnectionAccountRecord";

export class PeerConnectionAccountStorage {
  static readonly PEER_CONNECTION_ACCOUNT_RECORD_MISSING =
    "Peer connection account record does not exist";
  private storageService: StorageService<PeerConnectionAccountRecord>;

  constructor(storageService: StorageService<PeerConnectionAccountRecord>) {
    this.storageService = storageService;
  }

  async getPeerConnection(id: string): Promise<PeerConnection> {
    const metadata = await this.getPeerConnectionAccount(id);

    return {
      id: metadata.getDappIdentifier(),
      iconB64: metadata.iconB64,
      name: metadata.name,
      selectedAid: metadata.getIdentifier(),
      url: metadata.url,
      createdAt: metadata.createdAt.toISOString(),
    };
  }

  private async getPeerConnectionAccount(
    id: string // compositionId: <dappId>:<identifier>
  ): Promise<PeerConnectionAccountRecord> {
    const metadata = await this.storageService.findById(
      id,
      PeerConnectionAccountRecord
    );
    if (!metadata) {
      throw new Error(
        PeerConnectionAccountStorage.PEER_CONNECTION_ACCOUNT_RECORD_MISSING
      );
    }
    return metadata;
  }

  async getAllPeerConnectionAccount(): Promise<PeerConnection[]> {
    const records = await this.storageService.getAll(
      PeerConnectionAccountRecord
    );
    return records.map((record) => ({
      id: record.id,
      iconB64: record.iconB64,
      name: record.name,
      selectedAid: record.getIdentifier(),
      url: record.url,
      createdAt: record.createdAt.toISOString(),
    }));
  }

  async updatePeerConnectionAccount(
    id: string,
    metadata: Partial<
      Pick<PeerConnectionAccountRecord, "name" | "url" | "iconB64">
    >
  ): Promise<void> {
    const identifierMetadataRecord = await this.getPeerConnectionAccount(id);
    if (metadata.name !== undefined)
      identifierMetadataRecord.name = metadata.name;
    if (metadata.url !== undefined) identifierMetadataRecord.url = metadata.url;
    if (metadata.iconB64 !== undefined)
      identifierMetadataRecord.iconB64 = metadata.iconB64;
    await this.storageService.update(identifierMetadataRecord);
  }

  async createPeerConnectionAccountRecord(
    data: PeerConnectionAccountRecordStorageProps
  ): Promise<void> {
    const record = new PeerConnectionAccountRecord(data);
    await this.storageService.save(record);
  }

  async deletePeerConnectionAccountRecord(id: string): Promise<void> {
    await this.storageService.deleteById(id);
  }
}
