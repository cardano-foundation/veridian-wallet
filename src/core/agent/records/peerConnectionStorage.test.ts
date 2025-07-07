import { PeerConnectionMetadataRecord } from "./peerConnectionMetadataRecord";
import { PeerConnectionStorage } from "./peerConnectionStorage";

const storageService = jest.mocked({
  save: jest.fn(),
  delete: jest.fn(),
  deleteById: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByQuery: jest.fn(),
  getAll: jest.fn(),
});

const peerConnectionStorage = new PeerConnectionStorage(storageService as any);

const peerConnectionMetadataRecordProps = {
  id: "id",
  name: "name",
  url: "url",
  iconB64: "icon",
  selectedAid: "aid",
  createdAt: new Date(),
};

const peerConnectionMetadataRecord = new PeerConnectionMetadataRecord({
  ...peerConnectionMetadataRecordProps,
});

const peerConnectionMetadataRecord2 = new PeerConnectionMetadataRecord({
  ...peerConnectionMetadataRecordProps,
  id: "id2",
});

describe("Connection service of agent", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("Should get all peer connection", async () => {
    storageService.getAll.mockResolvedValue([
      peerConnectionMetadataRecord,
      peerConnectionMetadataRecord2,
    ]);
    expect(await peerConnectionStorage.getAllPeerConnectionMetadata()).toEqual(
      [peerConnectionMetadataRecord, peerConnectionMetadataRecord2].map(
        (record) => ({
          id: record.id,
          iconB64: record.iconB64,
          name: record.name,
          selectedAid: record.selectedAid,
          url: record.url,
          createdAt: record.createdAt.toISOString(),
        })
      )
    );
  });

  test("Should get peer connection meta data record", async () => {
    storageService.findById.mockResolvedValue(peerConnectionMetadataRecord);
    expect(
      await peerConnectionStorage.getPeerConnectionMetadata(
        peerConnectionMetadataRecord.id
      )
    ).toEqual(peerConnectionMetadataRecord);
  });

  test("Should get peer connection", async () => {
    storageService.findById.mockResolvedValue(peerConnectionMetadataRecord);
    expect(
      await peerConnectionStorage.getPeerConnection(
        peerConnectionMetadataRecord.id
      )
    ).toEqual({
      id: peerConnectionMetadataRecord.id,
      iconB64: peerConnectionMetadataRecord.iconB64,
      name: peerConnectionMetadataRecord.name,
      selectedAid: peerConnectionMetadataRecord.selectedAid,
      url: peerConnectionMetadataRecord.url,
      createdAt: peerConnectionMetadataRecord.createdAt.toISOString(),
    });
  });

  test("Should throw if peerConnection metadata record is missing", async () => {
    storageService.findById.mockResolvedValue(null);
    await expect(
      peerConnectionStorage.getPeerConnectionMetadata(
        peerConnectionMetadataRecord.id
      )
    ).rejects.toThrowError(
      PeerConnectionStorage.PEER_CONNECTION_METADATA_RECORD_MISSING
    );
  });

  test("Should save peerConnection metadata record", async () => {
    await peerConnectionStorage.createPeerConnectionMetadataRecord(
      peerConnectionMetadataRecordProps
    );
    expect(storageService.save).toBeCalledWith(peerConnectionMetadataRecord);
  });

  test("Should update peer connection metadata record", async () => {
    storageService.findById.mockResolvedValue(peerConnectionMetadataRecord);
    await peerConnectionStorage.updatePeerConnectionMetadata(
      peerConnectionMetadataRecord.id,
      {
        name: "update name",
      }
    );
    expect(storageService.update).toBeCalled();
  });
});
