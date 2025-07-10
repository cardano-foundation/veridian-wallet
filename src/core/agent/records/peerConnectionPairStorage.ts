import { PeerConnection } from "../../cardano/walletConnect/peerConnection.types";
import { StorageService } from "../../storage/storage.types";
import {
  PeerConnectionPairRecord,
  PeerConnectionPairRecordProps,
} from "./peerConnectionPairRecord";

export class PeerConnectionPairStorage {
  static readonly PEER_CONNECTION_ACCOUNT_RECORD_MISSING =
    "Peer connection account record does not exist";
  private storageService: StorageService<PeerConnectionPairRecord>;

  constructor(storageService: StorageService<PeerConnectionPairRecord>) {
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
  ): Promise<PeerConnectionPairRecord> {
    const metadata = await this.storageService.findById(
      id,
      PeerConnectionPairRecord
    );
    if (!metadata) {
      throw new Error(
        PeerConnectionPairStorage.PEER_CONNECTION_ACCOUNT_RECORD_MISSING
      );
    }
    return metadata;
  }

  async getAllPeerConnectionAccount(): Promise<PeerConnection[]> {
    const records = await this.storageService.getAll(PeerConnectionPairRecord);
    return records.map((record) => ({
      id: record.getDappIdentifier(),
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
      Pick<PeerConnectionPairRecord, "name" | "url" | "iconB64">
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

  async createPeerConnectionPairRecord(
    data: PeerConnectionPairRecordProps
  ): Promise<void> {
    const record = new PeerConnectionPairRecord(data);
    await this.storageService.save(record);
  }

  async deletepeerConnectionPairRecord(id: string): Promise<void> {
    await this.storageService.deleteById(id);
  }
}
