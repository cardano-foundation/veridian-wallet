import { StorageService } from "../../storage/storage.types";
import {
  PeerConnectionAccountRecord,
  PeerConnectionAccountRecordStorageProps,
} from "./peerConnectionAccountRecord";

export class PeerConnectionAccountStorage {
  private storageService: StorageService<PeerConnectionAccountRecord>;

  constructor(storageService: StorageService<PeerConnectionAccountRecord>) {
    this.storageService = storageService;
  }

  save(
    props: PeerConnectionAccountRecordStorageProps
  ): Promise<PeerConnectionAccountRecord> {
    const record = new PeerConnectionAccountRecord(props);
    return this.storageService.save(record);
  }

  delete(record: PeerConnectionAccountRecord): Promise<void> {
    return this.storageService.delete(record);
  }

  deleteById(id: string): Promise<void> {
    return this.storageService.deleteById(id);
  }

  update(record: PeerConnectionAccountRecord): Promise<void> {
    return this.storageService.update(record);
  }

  findById(id: string): Promise<PeerConnectionAccountRecord | null> {
    return this.storageService.findById(id, PeerConnectionAccountRecord);
  }

  findAllByQuery(query: any): Promise<PeerConnectionAccountRecord[]> {
    return this.storageService.findAllByQuery(
      query,
      PeerConnectionAccountRecord
    );
  }

  getAll(): Promise<PeerConnectionAccountRecord[]> {
    return this.storageService.getAll(PeerConnectionAccountRecord);
  }

  findByPeerConnectionId(
    peerConnectionId: string
  ): Promise<PeerConnectionAccountRecord[]> {
    return this.findAllByQuery({ peerConnectionId });
  }

  findByAccountId(accountId: string): Promise<PeerConnectionAccountRecord[]> {
    return this.findAllByQuery({ accountId });
  }

  findByPeerConnectionAndAccount(
    peerConnectionId: string,
    accountId: string
  ): Promise<PeerConnectionAccountRecord[]> {
    return this.findAllByQuery({ peerConnectionId, accountId });
  }
}
