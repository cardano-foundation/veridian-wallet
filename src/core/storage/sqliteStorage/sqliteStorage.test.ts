import { SqliteStorage } from "./sqliteStorage";
import { convertDbQuery } from "./utils";
import { StorageMessage, StorageRecord } from "../storage.types";
import { BasicRecord } from "../../agent/records";

const startTime = new Date();

const connectionMock = {
  open: jest.fn(),
  execute: jest.fn(),
  query: jest.fn(),
  close: jest.fn(),
  executeTransaction: jest.fn(),
  isDBOpen: jest.fn().mockResolvedValue(true),
};
// ------ MOCKS ------
const setMock = jest
  .spyOn(SqliteStorage.prototype, "createItem")
  .mockImplementation();
const updateMock = jest
  .spyOn(SqliteStorage.prototype, "updateItem")
  .mockImplementation();
const removeMock = jest
  .spyOn(SqliteStorage.prototype, "deleteItem")
  .mockImplementation();
const getMock = jest
  .spyOn(SqliteStorage.prototype, "getItem")
  .mockImplementation(async (id: string) => {
    if (id === existingRecord.id) {
      return {
        category: existingRecord.type,
        name: existingRecord.id,
        value: JSON.stringify({
          id: "test1",
          content: {
            test: 1,
          },
          updatedAt: startTime,
        }),
        tags: {},
      };
    }
    return undefined;
  });
const getAllKvMock = jest
  .spyOn(SqliteStorage.prototype, "scanItems")
  .mockImplementation(
    async (type: string, query: any): Promise<StorageRecord[]> => {
      const records = [
        {
          category: BasicRecord.type,
          name: existingRecord.id,
          value: JSON.stringify({
            id: existingRecord.id,
            updatedAt: startTime,
          }),
          tags: { firstTag: "exists", secondTag: "exists" },
        },
        {
          category: BasicRecord.type,
          name: newRecord.id,
          value: JSON.stringify({
            id: "storagerecord-0",
            storageVersion: "0.0.1",
          }),
          tags: { firstTag: "exists1", secondTag: "exists1" },
        },
      ] as StorageRecord[];
      let instances: StorageRecord[] = [];
      if (query) {
        records.forEach((record) => {
          if (record.category && record.category === type) {
            for (const [queryKey, queryVal] of Object.entries(query)) {
              if (
                record.tags[queryKey] !== queryVal &&
                queryVal !== undefined
              ) {
                return;
              }
            }
            instances.push(record);
          }
        });
      } else {
        instances = records;
      }
      return instances;
    }
  );

jest.mock("@capacitor-community/sqlite", () => ({
  CapacitorSQLite: jest.fn().mockImplementation(() => {
    return {};
  }),
  SQLiteConnection: jest.fn().mockImplementation(() => {
    return {
      checkConnectionsConsistency: jest.fn().mockReturnValue({
        result: "OK",
      }),
      isConnection: jest.fn().mockReturnValue({
        result: true,
      }),
      retrieveConnection: jest.fn().mockReturnValue(connectionMock),
      createConnection: jest.fn().mockReturnValue(connectionMock),
    };
  }),
  SQLiteDBConnection: jest.fn(),
}));

// ------ TEST OBJECTS ------
const existingRecord = new BasicRecord({
  id: "test1",
  content: {
    test: 1,
  },
  createdAt: startTime,
});
const updatedRecord = new BasicRecord({
  id: "test1",
  createdAt: startTime,
  content: {
    test: 1,
  },
});
const newRecord = new BasicRecord({
  id: "test3",
  createdAt: startTime,
  content: {
    test: 1,
  },
});

const storageService = new SqliteStorage<BasicRecord>(connectionMock as any);

describe("Sqlite Storage Module: Storage Service", () => {
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
    expect(updateMock).toBeCalledWith(updatedRecord.id, {
      category: updatedRecord.type,
      name: updatedRecord.id,
      value: expect.any(String),
      tags: {},
    });
  });

  test("should not be able to update a record that does not exist", async () => {
    await expect(storageService.update(newRecord)).rejects.toThrowError(
      `${StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG} ${newRecord.id}`
    );
    expect(updateMock).not.toBeCalled();
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
    expect(getAllKvMock).toBeCalled();
    expect(result.length).toEqual(2);
    expect(result[0].id).toEqual(existingRecord.id);
  });

  test("should find an item if every record tag is part of the query", async () => {
    const tags = { firstTag: "exists", secondTag: "exists" };
    const result = await storageService.findAllByQuery(tags, BasicRecord);
    expect(getAllKvMock).toBeCalled();
    expect(result.length).toEqual(1);
  });

  test("should find an item if every query tag is part of the record tags", async () => {
    const tags = { firstTag: "exists" };
    const result = await storageService.findAllByQuery(tags, BasicRecord);
    expect(getAllKvMock).toBeCalled();
    expect(result.length).toEqual(1);
  });

  test("should not find an item by tag that doesn't exist", async () => {
    const tags = { doesNotExist: "doesNotExist" };
    const result = await storageService.findAllByQuery(tags, BasicRecord);
    expect(getAllKvMock).toBeCalled();
    expect(result.length).toEqual(0);
  });

  test("should only return an item if every tag matches", async () => {
    const tags = { firstTag: "exists", secondTag: "doesNotExist" };
    const result = await storageService.findAllByQuery(tags, BasicRecord);
    expect(getAllKvMock).toBeCalled();
    expect(result.length).toEqual(0);
  });
  test("should generate exactly sql condition normal", () => {
    const query = { firstTag: "exists", secondTag: "doesNotExist" };
    const expectedCondition =
      "EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?) AND EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?)";
    const expectdValues = ["firstTag", "exists", "secondTag", "doesNotExist"];
    const { condition, values } = storageService.getQueryConditionSql(query);
    expect(condition).toEqual(expectedCondition);
    expect(values).toMatchObject(expectdValues);
  });

  test("should generate exactly sql condition $and", () => {
    const query = {
      $and: [{ firstTag: "exists" }, { firstTag: "doesNotExist" }],
    };
    const expectedCondition =
      "(EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?)) AND (EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?))";
    const expectdValues = ["firstTag", "exists", "firstTag", "doesNotExist"];
    const { condition, values } = storageService.getQueryConditionSql(query);
    expect(condition).toEqual(expectedCondition);
    expect(values).toMatchObject(expectdValues);
  });

  test("should generate exactly sql condition $OR", () => {
    const query = {
      $or: [{ firstTag: "exists" }, { secondTag: "doesNotExist" }],
    };
    const expectedCondition =
      "(EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?)) OR (EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?))";
    const expectdValues = ["firstTag", "exists", "secondTag", "doesNotExist"];
    const { condition, values } = storageService.getQueryConditionSql(query);
    expect(condition).toEqual(expectedCondition);
    expect(values).toMatchObject(expectdValues);
  });

  test("should generate exactly sql condition $NOT", () => {
    const query = {
      $not: { firstTag: "exists", secondTag: "doesNotExist" },
    };
    const expectedCondition =
      "NOT (EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?) AND EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?))";
    const expectdValues = ["firstTag", "exists", "secondTag", "doesNotExist"];
    const { condition, values } = storageService.getQueryConditionSql(query);
    expect(condition).toEqual(expectedCondition);
    expect(values).toMatchObject(expectdValues);
  });
  test("should generate exactly sql condition complex", () => {
    const query = {
      $not: { firstTag: "exists" },
      $or: [{ firstTag: "doesNotExist" }, { secondTag: "doesNotExist" }],
      thirdTag: "exists",
    };
    const expectedCondition =
      "NOT (EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?)) AND (EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?)) OR (EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?)) AND EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?)";
    const expectdValues = [
      "firstTag",
      "exists",
      "firstTag",
      "doesNotExist",
      "secondTag",
      "doesNotExist",
      "thirdTag",
      "exists",
    ];
    const { condition, values } = storageService.getQueryConditionSql(query);
    expect(condition).toEqual(expectedCondition);
    expect(values).toMatchObject(expectdValues);
  });

  test("should generate exactly sql condition complex $or in $and", () => {
    const query = {
      $and: [
        { $or: [{ firstTag: "doesNotExist" }, { secondTag: "doesNotExist" }] },
        { thirdTag: "exists", otherTag: "exists" },
      ],
    };
    const expectedCondition =
      "((EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?)) OR (EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?))) AND (EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?) AND EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ? AND it.value = ?))";
    const expectdValues = [
      "firstTag",
      "doesNotExist",
      "secondTag",
      "doesNotExist",
      "thirdTag",
      "exists",
      "otherTag",
      "exists",
    ];
    const { condition, values } = storageService.getQueryConditionSql(query);
    expect(condition).toEqual(expectedCondition);
    expect(values).toMatchObject(expectdValues);
  });

  test("should generate exactly sql condition is null", () => {
    const query = {
      firstTag: null,
    };
    const expectedCondition =
      "NOT EXISTS (SELECT 1 FROM items_tags it WHERE i.id = it.item_id AND it.name = ?)";
    const expectdValues = ["firstTag"];
    const { condition, values } = storageService.getQueryConditionSql(query);
    expect(condition).toEqual(expectedCondition);
    expect(values).toMatchObject(expectdValues);
  });

  test("should not generate sql insert tag is null", () => {
    const query = {
      firstTag: null,
    };

    const insertSql = storageService.getTagsInsertSql("id", query);
    expect(insertSql.length).toEqual(0);
  });
});

describe("Sqlite Storage Module: Util", () => {
  test("convertDbQuery should work correctly", () => {
    const query = {
      field1: undefined,
      field2: true,
      field3: false,
      field4: "string",
      field5: null,
    };
    expect(convertDbQuery(query)).toEqual({
      field1: undefined,
      field2: "1",
      field3: "0",
      field4: "string",
      field5: null,
    });
  });
});
