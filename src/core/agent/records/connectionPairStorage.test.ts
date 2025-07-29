import { Query, StorageService } from "../../storage/storage.types";
import { CreationStatus } from "../agent.types";
import {
  ConnectionPairRecord,
  ConnectionPairRecordStorageProps,
} from "./connectionPairRecord";
import { ConnectionPairStorage } from "./connectionPairStorage";

// Mock the randomSalt function
jest.mock("../services/utils", () => ({
  randomSalt: jest.fn(() => "mocked-random-salt"),
}));

const storageService = jest.mocked<StorageService<ConnectionPairRecord>>({
  save: jest.fn(),
  delete: jest.fn(),
  deleteById: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByQuery: jest.fn(),
  getAll: jest.fn(),
});

const connectionPairStorage = new ConnectionPairStorage(storageService);

const id1 = "id1";
const id2 = "id2";
const contactId1 = "contact1";
const contactId2 = "contact2";
const identifier1 = "identifier1";
const identifier2 = "identifier2";

const now = new Date();

const connectionPairRecordProps: ConnectionPairRecordStorageProps = {
  id: id1,
  createdAt: now,
  contactId: contactId1,
  identifier: identifier1,
  creationStatus: CreationStatus.COMPLETE,
  pendingDeletion: false,
  tags: { category: "test" },
};

const connectionPairRecordA = new ConnectionPairRecord(connectionPairRecordProps);

const connectionPairRecordB = new ConnectionPairRecord({
  ...connectionPairRecordProps,
  id: id2,
  contactId: contactId2,
  identifier: identifier2,
  creationStatus: CreationStatus.PENDING,
});

describe("ConnectionPair Storage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("Should save connection pair record", async () => {
    storageService.save.mockResolvedValue(connectionPairRecordA);
    await connectionPairStorage.save(connectionPairRecordProps);
    expect(storageService.save).toBeCalledWith(connectionPairRecordA);
  });

  test("Should delete connection pair record", async () => {
    storageService.delete.mockResolvedValue();
    await connectionPairStorage.delete(connectionPairRecordA);
    expect(storageService.delete).toBeCalledWith(connectionPairRecordA);
  });

  test("Should delete connection pair record by ID", async () => {
    storageService.deleteById.mockResolvedValue();
    await connectionPairStorage.deleteById(connectionPairRecordA.id);
    expect(storageService.deleteById).toBeCalledWith(connectionPairRecordA.id);
  });

  test("Should update connection pair record", async () => {
    storageService.update.mockResolvedValue();
    await connectionPairStorage.update(connectionPairRecordA);
    expect(storageService.update).toBeCalledWith(connectionPairRecordA);
  });

  test("Should find connection pair record by ID", async () => {
    storageService.findById.mockResolvedValue(connectionPairRecordA);
    const result = await connectionPairStorage.findById(connectionPairRecordA.id);
    expect(result).toEqual(connectionPairRecordA);
    expect(storageService.findById).toBeCalledWith(connectionPairRecordA.id, ConnectionPairRecord);
  });

  test("Should find all connection pair records by query", async () => {
    const query: Query<ConnectionPairRecord> = {
      contactId: contactId1,
    };
    const records = [connectionPairRecordA, connectionPairRecordB];
    storageService.findAllByQuery.mockResolvedValue(records);
    const result = await connectionPairStorage.findAllByQuery(query);
    expect(result).toEqual(records);
    expect(storageService.findAllByQuery).toBeCalledWith(query, ConnectionPairRecord);
  });

  test("Should get all connection pair records", async () => {
    const records = [connectionPairRecordA, connectionPairRecordB];
    storageService.getAll.mockResolvedValue(records);
    const result = await connectionPairStorage.getAll();
    expect(result).toEqual(records);
    expect(storageService.getAll).toBeCalledWith(ConnectionPairRecord);
  });

  // Test the additional finder methods
  test("Should find connection pair records by contact ID", async () => {
    const records = [connectionPairRecordA];
    storageService.findAllByQuery.mockResolvedValue(records);
    const result = await connectionPairStorage.findByContactId(contactId1);
    expect(result).toEqual(records);
    expect(storageService.findAllByQuery).toBeCalledWith({ contactId: contactId1 }, ConnectionPairRecord);
  });

  test("Should find connection pair records by identifier", async () => {
    const records = [connectionPairRecordA];
    storageService.findAllByQuery.mockResolvedValue(records);
    const result = await connectionPairStorage.findByIdentifier(identifier1);
    expect(result).toEqual(records);
    expect(storageService.findAllByQuery).toBeCalledWith({ identifier: identifier1 }, ConnectionPairRecord);
  });

  test("Should find connection pair records by contact and identifier", async () => {
    const records = [connectionPairRecordA];
    storageService.findAllByQuery.mockResolvedValue(records);
    const result = await connectionPairStorage.findByContactAndIdentifier(contactId1, identifier1);
    expect(result).toEqual(records);
    expect(storageService.findAllByQuery).toBeCalledWith(
      { contactId: contactId1, identifier: identifier1 },
      ConnectionPairRecord
    );
  });

  // Error handling tests
  test("Should handle saving error", async () => {
    storageService.save.mockRejectedValue(new Error("Saving error"));
    await expect(connectionPairStorage.save(connectionPairRecordProps)).rejects.toThrow(
      "Saving error"
    );
  });

  test("Should handle deleting error", async () => {
    storageService.delete.mockRejectedValue(new Error("Deleting error"));
    await expect(connectionPairStorage.delete(connectionPairRecordA)).rejects.toThrow(
      "Deleting error"
    );
  });

  test("Should handle deleting by ID error", async () => {
    storageService.deleteById.mockRejectedValue(new Error("Deleting by ID error"));
    await expect(connectionPairStorage.deleteById(connectionPairRecordA.id)).rejects.toThrow(
      "Deleting by ID error"
    );
  });

  test("Should handle updating error", async () => {
    storageService.update.mockRejectedValue(new Error("Updating error"));
    await expect(connectionPairStorage.update(connectionPairRecordA)).rejects.toThrow(
      "Updating error"
    );
  });

  test("Should handle finding error", async () => {
    storageService.findById.mockRejectedValue(new Error("Finding error"));
    await expect(
      connectionPairStorage.findById(connectionPairRecordA.id)
    ).rejects.toThrow("Finding error");
  });

  test("Should handle findAllByQuery error", async () => {
    storageService.findAllByQuery.mockRejectedValue(new Error("Query error"));
    await expect(
      connectionPairStorage.findAllByQuery({ contactId: contactId1 })
    ).rejects.toThrow("Query error");
  });

  test("Should handle getAll error", async () => {
    storageService.getAll.mockRejectedValue(new Error("Get all error"));
    await expect(connectionPairStorage.getAll()).rejects.toThrow("Get all error");
  });

  test("Should handle findByContactId error", async () => {
    storageService.findAllByQuery.mockRejectedValue(new Error("Find by contact error"));
    await expect(connectionPairStorage.findByContactId(contactId1)).rejects.toThrow(
      "Find by contact error"
    );
  });

  test("Should handle findByIdentifier error", async () => {
    storageService.findAllByQuery.mockRejectedValue(new Error("Find by identifier error"));
    await expect(connectionPairStorage.findByIdentifier(identifier1)).rejects.toThrow(
      "Find by identifier error"
    );
  });

  test("Should handle findByContactAndIdentifier error", async () => {
    storageService.findAllByQuery.mockRejectedValue(new Error("Find by contact and identifier error"));
    await expect(
      connectionPairStorage.findByContactAndIdentifier(contactId1, identifier1)
    ).rejects.toThrow("Find by contact and identifier error");
  });

  // Edge cases
  test("Should handle not found", async () => {
    storageService.findById.mockResolvedValue(null);
    const result = await connectionPairStorage.findById("nonexistentId");
    expect(result).toBeNull();
  });

  test("Should handle empty result", async () => {
    storageService.findAllByQuery.mockResolvedValue([]);
    const result = await connectionPairStorage.findAllByQuery({ filter: {} });
    expect(result).toEqual([]);
  });

  test("Should handle empty result for getAll", async () => {
    storageService.getAll.mockResolvedValue([]);
    const result = await connectionPairStorage.getAll();
    expect(result).toEqual([]);
  });

  test("Should handle empty result for findByContactId", async () => {
    storageService.findAllByQuery.mockResolvedValue([]);
    const result = await connectionPairStorage.findByContactId("nonexistentContact");
    expect(result).toEqual([]);
  });

  test("Should handle empty result for findByIdentifier", async () => {
    storageService.findAllByQuery.mockResolvedValue([]);
    const result = await connectionPairStorage.findByIdentifier("nonexistentIdentifier");
    expect(result).toEqual([]);
  });

  test("Should handle empty result for findByContactAndIdentifier", async () => {
    storageService.findAllByQuery.mockResolvedValue([]);
    const result = await connectionPairStorage.findByContactAndIdentifier(
      "nonexistentContact",
      "nonexistentIdentifier"
    );
    expect(result).toEqual([]);
  });

  // Test record creation with minimal required fields
  test("Should handle connection pair record with minimal required fields", async () => {
    const minimalProps: ConnectionPairRecordStorageProps = {
      contactId: contactId1,
      identifier: identifier1,
    };
    const minimalRecord = new ConnectionPairRecord(minimalProps);
    storageService.save.mockResolvedValue(minimalRecord);
    
    await connectionPairStorage.save(minimalProps);
    expect(storageService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        contactId: contactId1,
        identifier: identifier1,
        creationStatus: CreationStatus.PENDING, // default value
        pendingDeletion: false, // default value
        type: "ConnectionPairRecord",
      })
    );
  });

  // Test different creation statuses
  test("Should handle connection pair record with PENDING status", async () => {
    const pendingProps: ConnectionPairRecordStorageProps = {
      contactId: contactId1,
      identifier: identifier1,
      creationStatus: CreationStatus.PENDING,
    };
    const pendingRecord = new ConnectionPairRecord(pendingProps);
    storageService.save.mockResolvedValue(pendingRecord);
    
    await connectionPairStorage.save(pendingProps);
    expect(storageService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        contactId: contactId1,
        identifier: identifier1,
        creationStatus: CreationStatus.PENDING,
        pendingDeletion: false, // default value
        type: "ConnectionPairRecord",
      })
    );
  });

  test("Should handle connection pair record with FAILED status", async () => {
    const failedProps: ConnectionPairRecordStorageProps = {
      contactId: contactId1,
      identifier: identifier1,
      creationStatus: CreationStatus.FAILED,
    };
    const failedRecord = new ConnectionPairRecord(failedProps);
    storageService.save.mockResolvedValue(failedRecord);
    
    await connectionPairStorage.save(failedProps);
    expect(storageService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        contactId: contactId1,
        identifier: identifier1,
        creationStatus: CreationStatus.FAILED,
        pendingDeletion: false, // default value
        type: "ConnectionPairRecord",
      })
    );
  });

  test("Should handle connection pair record with pendingDeletion true", async () => {
    const deletionProps: ConnectionPairRecordStorageProps = {
      contactId: contactId1,
      identifier: identifier1,
      pendingDeletion: true,
    };
    const deletionRecord = new ConnectionPairRecord(deletionProps);
    storageService.save.mockResolvedValue(deletionRecord);
    
    await connectionPairStorage.save(deletionProps);
    expect(storageService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        contactId: contactId1,
        identifier: identifier1,
        creationStatus: CreationStatus.PENDING, // default value
        pendingDeletion: true,
        type: "ConnectionPairRecord",
      })
    );
  });

  // Test complex queries
  test("Should handle complex query with multiple filters", async () => {
    const complexQuery = {
      contactId: contactId1,
      creationStatus: CreationStatus.COMPLETE,
      pendingDeletion: false,
    };
    const records = [connectionPairRecordA];
    storageService.findAllByQuery.mockResolvedValue(records);
    
    const result = await connectionPairStorage.findAllByQuery(complexQuery);
    expect(result).toEqual(records);
    expect(storageService.findAllByQuery).toBeCalledWith(complexQuery, ConnectionPairRecord);
  });
}); 