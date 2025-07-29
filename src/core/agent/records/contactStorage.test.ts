import {
  Query,
  StorageMessage,
  StorageService,
} from "../../storage/storage.types";
import { ContactRecord, ContactRecordStorageProps } from "./contactRecord";
import { ContactStorage } from "./contactStorage";

// Mock the randomSalt function
jest.mock("../services/utils", () => ({
  randomSalt: jest.fn(() => "mocked-random-salt"),
}));

const storageService = jest.mocked<StorageService<ContactRecord>>({
  save: jest.fn(),
  delete: jest.fn(),
  deleteById: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByQuery: jest.fn(),
  getAll: jest.fn(),
});

const contactStorage = new ContactStorage(storageService);

const id1 = "id1";
const id2 = "id2";
const groupId1 = "group1";

const now = new Date();

const contactRecordProps: ContactRecordStorageProps = {
  id: id1,
  createdAt: now,
  alias: "test-contact",
  oobi: "test-oobi",
  groupId: groupId1,
  tags: { category: "friend" },
};

const contactRecordA = new ContactRecord(contactRecordProps);

const contactRecordB = new ContactRecord({
  ...contactRecordProps,
  id: id2,
  alias: "another-contact",
});

describe("Contact Storage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("Should save contact record", async () => {
    storageService.save.mockResolvedValue(contactRecordA);
    await contactStorage.save(contactRecordProps);
    expect(storageService.save).toBeCalledWith(contactRecordA);
  });

  test("Should delete contact record", async () => {
    storageService.delete.mockResolvedValue();
    await contactStorage.delete(contactRecordA);
    expect(storageService.delete).toBeCalledWith(contactRecordA);
  });

  test("Should delete contact record by ID", async () => {
    storageService.deleteById.mockResolvedValue();
    await contactStorage.deleteById(contactRecordA.id);
    expect(storageService.deleteById).toBeCalledWith(contactRecordA.id);
  });

  test("Should update contact record", async () => {
    storageService.update.mockResolvedValue();
    await contactStorage.update(contactRecordA);
    expect(storageService.update).toBeCalledWith(contactRecordA);
  });

  test("Should find contact record by ID", async () => {
    storageService.findById.mockResolvedValue(contactRecordA);
    const result = await contactStorage.findById(contactRecordA.id);
    expect(result).toEqual(contactRecordA);
    expect(storageService.findById).toBeCalledWith(
      contactRecordA.id,
      ContactRecord
    );
  });

  test("Should find all contact records by query", async () => {
    const query: Query<ContactRecord> = {
      alias: "test-contact",
    };
    const records = [contactRecordA, contactRecordB];
    storageService.findAllByQuery.mockResolvedValue(records);
    const result = await contactStorage.findAllByQuery(query);
    expect(result).toEqual(records);
    expect(storageService.findAllByQuery).toBeCalledWith(query, ContactRecord);
  });

  test("Should get all contact records", async () => {
    const records = [contactRecordA, contactRecordB];
    storageService.getAll.mockResolvedValue(records);
    const result = await contactStorage.getAll();
    expect(result).toEqual(records);
    expect(storageService.getAll).toBeCalledWith(ContactRecord);
  });

  test("Should find expected contact record by ID", async () => {
    storageService.findById.mockResolvedValue(contactRecordA);
    const result = await contactStorage.findExpectedById(contactRecordA.id);
    expect(result).toEqual(contactRecordA);
    expect(storageService.findById).toBeCalledWith(
      contactRecordA.id,
      ContactRecord
    );
  });

  test("Should throw error when expected contact record not found", async () => {
    storageService.findById.mockResolvedValue(null);
    await expect(
      contactStorage.findExpectedById("nonexistentId")
    ).rejects.toThrow(StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG);
  });

  // Error handling tests
  test("Should handle saving error", async () => {
    storageService.save.mockRejectedValue(new Error("Saving error"));
    await expect(contactStorage.save(contactRecordProps)).rejects.toThrow(
      "Saving error"
    );
  });

  test("Should handle deleting error", async () => {
    storageService.delete.mockRejectedValue(new Error("Deleting error"));
    await expect(contactStorage.delete(contactRecordA)).rejects.toThrow(
      "Deleting error"
    );
  });

  test("Should handle deleting by ID error", async () => {
    storageService.deleteById.mockRejectedValue(
      new Error("Deleting by ID error")
    );
    await expect(contactStorage.deleteById(contactRecordA.id)).rejects.toThrow(
      "Deleting by ID error"
    );
  });

  test("Should handle updating error", async () => {
    storageService.update.mockRejectedValue(new Error("Updating error"));
    await expect(contactStorage.update(contactRecordA)).rejects.toThrow(
      "Updating error"
    );
  });

  test("Should handle finding error", async () => {
    storageService.findById.mockRejectedValue(new Error("Finding error"));
    await expect(contactStorage.findById(contactRecordA.id)).rejects.toThrow(
      "Finding error"
    );
  });

  test("Should handle findExpectedById error", async () => {
    storageService.findById.mockRejectedValue(new Error("Finding error"));
    await expect(
      contactStorage.findExpectedById(contactRecordA.id)
    ).rejects.toThrow("Finding error");
  });

  test("Should handle findAllByQuery error", async () => {
    storageService.findAllByQuery.mockRejectedValue(new Error("Query error"));
    await expect(
      contactStorage.findAllByQuery({ alias: "test" })
    ).rejects.toThrow("Query error");
  });

  test("Should handle getAll error", async () => {
    storageService.getAll.mockRejectedValue(new Error("Get all error"));
    await expect(contactStorage.getAll()).rejects.toThrow("Get all error");
  });

  // Edge cases
  test("Should handle not found", async () => {
    storageService.findById.mockResolvedValue(null);
    const result = await contactStorage.findById("nonexistentId");
    expect(result).toBeNull();
  });

  test("Should handle empty result", async () => {
    storageService.findAllByQuery.mockResolvedValue([]);
    const result = await contactStorage.findAllByQuery({ filter: {} });
    expect(result).toEqual([]);
  });

  test("Should handle empty result for getAll", async () => {
    storageService.getAll.mockResolvedValue([]);
    const result = await contactStorage.getAll();
    expect(result).toEqual([]);
  });

  test("Should handle contact record without optional fields", async () => {
    const minimalProps: ContactRecordStorageProps = {
      alias: "minimal-contact",
      oobi: "minimal-oobi",
    };
    const minimalRecord = new ContactRecord(minimalProps);
    storageService.save.mockResolvedValue(minimalRecord);

    await contactStorage.save(minimalProps);
    expect(storageService.save).toBeCalledWith(minimalRecord);
  });

  test("Should handle query with groupId filter", async () => {
    const query: Query<ContactRecord> = {
      groupId: groupId1,
    };
    const records = [contactRecordA];
    storageService.findAllByQuery.mockResolvedValue(records);

    const result = await contactStorage.findAllByQuery(query);
    expect(result).toEqual(records);
    expect(storageService.findAllByQuery).toBeCalledWith(query, ContactRecord);
  });
});
