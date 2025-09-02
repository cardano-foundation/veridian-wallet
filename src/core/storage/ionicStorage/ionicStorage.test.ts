import { IonicStorage } from "./ionicStorage";
import { BasicRecord } from "../../agent/records";
import { StorageMessage } from "../storage.types";

const startTime = new Date();

// ------ MOCKS ------

const setMock = jest.fn();
const removeMock = jest.fn();
const getMock = jest.fn().mockImplementation(async (id: string) => {
  if (id === existingRecord.id) {
    return {
      category: existingRecord.type,
      name: existingRecord.id,
      value: JSON.stringify({
        id: "test1",
        content: {
          test: "1",
        },
        createdAt: startTime,
      }),
      tags: {},
    };
  }
  return undefined;
});
const forEachMock = jest.fn().mockImplementation((fn: () => void) => {
  const items = [
    {
      category: BasicRecord.type,
      name: existingRecord.id,
      value: JSON.stringify({
        id: existingRecord.id,
        updatedAt: startTime,
        content: {
          test: "1",
        },
      }),
      tags: { firstTag: "exists", secondTag: "exists" },
    },
    {
      category: BasicRecord.type,
      name: existingRecord.id,
      value: JSON.stringify({
        id: "test-0",
        updatedAt: startTime,
        content: {
          test: "1",
        },
      }),
      tags: { firstTag: "exists2", secondTag: "exists2" },
    },

    {
      category: BasicRecord.type,
      name: existingRecord.id,
      value: JSON.stringify({
        id: "test-0",
        updatedAt: startTime,
        content: {
          test: "1",
        },
      }),
      tags: { firstTag: "exists3", secondTag: "exists3" },
    },
    {
      category: BasicRecord.type,
      name: existingRecord.id,
      value: JSON.stringify({
        id: "test-0",
        updatedAt: startTime,
        content: {
          test: "1",
        },
      }),
      tags: { firstTag: null, secondTag: "exists3" },
    },
  ];
  items.forEach(fn);
});

const storageMock = {
  set: setMock,
  get: getMock,
  remove: removeMock,
  forEach: forEachMock,
  create: jest.fn(),
};

jest.mock("@ionic/storage", () => ({
  Storage: jest.fn().mockImplementation(() => {
    return {
      set: setMock,
      get: getMock,
      remove: removeMock,
      forEach: forEachMock,
      create: jest.fn(),
    };
  }),
  Drivers: {
    IndexedDB: "IndexedDB",
  },
}));

// ------ TEST OBJECTS ------
const existingRecord = new BasicRecord({
  id: "test1",
  content: {
    test: "1",
  },
  createdAt: startTime,
});
const updatedRecord = new BasicRecord({
  id: "test1",
  content: {
    test: "1",
  },
  createdAt: startTime,
});
const newRecord = new BasicRecord({
  id: "test3",
  content: {
    test: "1",
  },
  createdAt: startTime,
});

const storageService = new IonicStorage<BasicRecord>(storageMock as any);

describe("Ionic Storage Module: Basic Storage Service", () => {
  test("should be able to store a new record", async () => {
    await storageService.save(newRecord);
    expect(setMock).toBeCalledWith(newRecord.id, {
      category: newRecord.type,
      name: newRecord.id,
      value: expect.any(String),
      tags: {},
    });
  });

  test("should not be able to store an already existing record", async () => {
    await expect(storageService.save(existingRecord)).rejects.toThrowError(
      `${StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG} ${existingRecord.id}`
    );
    expect(setMock).not.toBeCalled();
  });

  test("should be able to update an already existing record", async () => {
    await storageService.update(updatedRecord);
    expect(setMock).toBeCalledWith(updatedRecord.id, {
      category: updatedRecord.type,
      name: updatedRecord.id,
      value: JSON.stringify(updatedRecord),
      tags: {},
    });
  });

  test("should not be able to update a record that does not exist", async () => {
    await expect(storageService.update(newRecord)).rejects.toThrowError(
      `${StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG} ${newRecord.id}`
    );
    expect(setMock).not.toBeCalled();
  });

  test("updatedAt timestamp should be bumped after saving", async () => {
    await storageService.update(updatedRecord);
    expect(setMock).toBeCalledWith(updatedRecord.id, {
      category: updatedRecord.type,
      name: updatedRecord.id,
      value: JSON.stringify(updatedRecord),
      tags: {},
    });
    expect(updatedRecord.updatedAt?.getTime()).toBeGreaterThan(
      startTime.getTime()
    );
  });

  test("should be able to delete an existing record", async () => {
    await storageService.delete(existingRecord);
    expect(getMock).toBeCalledWith(existingRecord.id);
    expect(removeMock).toBeCalledWith(existingRecord.id);
  });

  test("should not be able to delete a record that does not exist", async () => {
    await expect(storageService.delete(newRecord)).rejects.toThrowError(
      `${StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG} ${newRecord.id}`
    );
    expect(getMock).toBeCalledWith(newRecord.id);
    expect(removeMock).not.toBeCalled();
  });

  test("should be able to delete an existing record by id", async () => {
    await storageService.deleteById(existingRecord.id);
    expect(getMock).toBeCalledWith(existingRecord.id);
    expect(removeMock).toBeCalledWith(existingRecord.id);
  });

  test("should not be able to delete a record by id that does not exist", async () => {
    await expect(storageService.deleteById(newRecord.id)).rejects.toThrowError(
      `${StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG} ${newRecord.id}`
    );
    expect(getMock).toBeCalledWith(newRecord.id);
    expect(removeMock).not.toBeCalled();
  });

  test("should get an existing record", async () => {
    const record = await storageService.findById(
      existingRecord.id,
      BasicRecord
    );
    expect(getMock).toBeCalledWith(existingRecord.id);
    expect(record?.type).toEqual(BasicRecord.type);
    expect(record?.id).toEqual(existingRecord.id);
  });

  test("should get an non existing record", async () => {
    const nonExistingId = "nonExistingId";
    const record = await storageService.findById(nonExistingId, BasicRecord);
    expect(getMock).toBeCalledWith(nonExistingId);
    expect(record).toEqual(null);
  });

  test("should return all items for a record type but none others", async () => {
    const result = await storageService.getAll(BasicRecord);
    expect(forEachMock).toBeCalled();
    expect(result.length).toEqual(4);
    expect(result[0].id).toEqual(existingRecord.id);
  });

  test("should find an item if every record tag is part of the query", async () => {
    const tags = { firstTag: "exists", secondTag: "exists" };
    const result = await storageService.findAllByQuery(tags, BasicRecord);
    expect(forEachMock).toBeCalled();
    expect(result.length).toEqual(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: existingRecord.id,
        content: { test: "1" },
        _tags: { firstTag: "exists", secondTag: "exists" },
      })
    );
  });

  test("should find an item if every query tag is part of the record tags", async () => {
    const tags = { firstTag: "exists" };
    const result = await storageService.findAllByQuery(tags, BasicRecord);
    expect(forEachMock).toBeCalled();
    expect(result.length).toEqual(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: existingRecord.id,
        content: { test: "1" },
        _tags: { firstTag: "exists", secondTag: "exists" },
      })
    );
  });

  test("should not find an item by tag that doesn't exist", async () => {
    const tags = { doesNotExist: "doesNotExist" };
    const result = await storageService.findAllByQuery(tags, BasicRecord);
    expect(forEachMock).toBeCalled();
    expect(result.length).toEqual(0);
  });

  test("should only return an item if every tag matches", async () => {
    const tags = { firstTag: "exists", secondTag: "doesNotExist" };
    const result = await storageService.findAllByQuery(tags, BasicRecord);
    expect(forEachMock).toBeCalled();
    expect(result.length).toEqual(0);
  });

  test("should find items with $or query", async () => {
    const query = { $or: [{ firstTag: "exists" }, { firstTag: "exists2" }] };
    const result = await storageService.findAllByQuery(query, BasicRecord);
    expect(forEachMock).toBeCalled();
    expect(result).toMatchObject([
      {
        _tags: { firstTag: "exists", secondTag: "exists" },
        type: BasicRecord.type,
        id: "test1",
      },
      {
        _tags: { firstTag: "exists2", secondTag: "exists2" },
        type: BasicRecord.type,
        id: "test-0",
      },
    ]);
  });

  test("should find items with $not query", async () => {
    const query = { $not: { firstTag: "exists" } };
    const result = await storageService.findAllByQuery(query, BasicRecord);
    expect(forEachMock).toBeCalled();
    expect(result).toMatchObject([
      {
        _tags: { firstTag: "exists2", secondTag: "exists2" },
        type: BasicRecord.type,
        id: "test-0",
      },
      {
        _tags: { firstTag: "exists3", secondTag: "exists3" },
        type: BasicRecord.type,
        id: "test-0",
      },
      {
        _tags: { firstTag: null, secondTag: "exists3" },
        type: BasicRecord.type,
        id: "test-0",
      },
    ]);
  });

  test("should find an item with $and query", async () => {
    const tags = { $and: [{ firstTag: "exists" }, { secondTag: "exists" }] };
    const result = await storageService.findAllByQuery(tags, BasicRecord);
    expect(forEachMock).toBeCalled();
    expect(result.length).toEqual(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: existingRecord.id,
        content: { test: "1" },
        _tags: { firstTag: "exists", secondTag: "exists" },
      })
    );
  });

  test("should find an item with null query", async () => {
    const tags = { firstTag: null };
    const result = await storageService.findAllByQuery(tags, BasicRecord);
    expect(forEachMock).toBeCalled();
    expect(result.length).toEqual(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: "test-0",
        content: { test: "1" },
        _tags: { firstTag: null, secondTag: "exists3" },
      })
    );
  });

  test("should find an item with multiple queries", async () => {
    const tags = {
      $and: [{ firstTag: "exists" }],
      $not: [{ secondTag: null }],
    };
    const result = await storageService.findAllByQuery(tags, BasicRecord);
    expect(forEachMock).toBeCalled();
    expect(result.length).toEqual(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: existingRecord.id,
        content: { test: "1" },
        _tags: { firstTag: "exists", secondTag: "exists" },
      })
    );
  });
});
