import { Storage } from "@ionic/storage";
import {
  Query,
  BaseRecord,
  StorageService,
  BaseRecordConstructor,
  StorageMessage,
} from "../storage.types";
import { deserializeRecord } from "../utils";
import { BasicRecord } from "../../agent/records";

class IonicStorage<T extends BaseRecord> implements StorageService<T> {
  private session: Storage;

  constructor(session: Storage) {
    this.session = session;
  }

  async save(record: T): Promise<T> {
    record.updatedAt = new Date();
    if (await this.session.get(record.id)) {
      throw new Error(
        `${StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG} ${record.id}`
      );
    }
    await this.session.set(record.id, {
      category: record.type,
      name: record.id,
      value: JSON.stringify(record),
      tags: record.getTags(),
    });
    return record;
  }

  async delete(record: T): Promise<void> {
    if (!(await this.session.get(record.id))) {
      throw new Error(
        `${StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG} ${record.id}`
      );
    }

    await this.session.remove(record.id);
  }

  async deleteById(id: string): Promise<void> {
    if (!(await this.session.get(id))) {
      throw new Error(
        `${StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG} ${id}`
      );
    }

    await this.session.remove(id);
  }

  async update(record: T): Promise<void> {
    if (!(await this.session.get(record.id))) {
      throw new Error(
        `${StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG} ${record.id}`
      );
    }

    record.updatedAt = new Date();

    const tags = record.getTags();

    await this.session.set(record.id, {
      category: record.type,
      name: record.id,
      value: JSON.stringify(record),
      tags,
    });
  }

  async findById(
    id: string,
    recordClass: BaseRecordConstructor<T>
  ): Promise<T | null> {
    const recordStorage = await this.session.get(id);

    if (!recordStorage || recordStorage.category !== recordClass.type) {
      return null;
    }
    return deserializeRecord(recordStorage, recordClass);
  }

  async findAllByQuery(
    query: Query<T>,
    recordClass: BaseRecordConstructor<T>
  ): Promise<T[]> {
    const instances: T[] = [];

    await this.session.forEach((record) => {
      if (
        record.category &&
        record.category === recordClass.type &&
        this.checkRecordIsValidWithQuery(record, query)
      ) {
        instances.push(deserializeRecord(record, recordClass));
      }
    });

    return instances;
  }

  async getAll(recordClass: BaseRecordConstructor<T>): Promise<T[]> {
    const instances: T[] = [];
    await this.session.forEach((value) => {
      if (value.category && value.category === recordClass.type) {
        instances.push(deserializeRecord(value, recordClass));
      }
    });

    return instances;
  }

  private checkRecordIsValidWithQuery(
    record: Record<string, unknown>,
    query: Query<BasicRecord>
  ): boolean {
    for (const [queryKey, queryVal] of Object.entries(query)) {
      if (queryKey === "$and") {
        if (
          !queryVal.every((query: Query<BasicRecord>) =>
            this.checkRecordIsValidWithQuery(record, query)
          )
        ) {
          return false;
        }
      } else if (queryKey === "$or") {
        if (
          !queryVal.some((query: Query<BasicRecord>) =>
            this.checkRecordIsValidWithQuery(record, query)
          )
        ) {
          return false;
        }
      } else if (queryKey === "$not") {
        if (this.checkRecordIsValidWithQuery(record, queryVal)) {
          return false;
        }
      } else {
        if (Array.isArray(queryVal) && queryVal.length > 0) {
          // compare them item by item
          const tags = record.tags as Record<string, unknown>;
          const check = queryVal.every(
            (element) =>
              Array.isArray(tags?.[queryKey]) &&
              tags[queryKey]?.includes(element)
          );
          if (!check) {
            return false;
          }
        } else {
          const tags = record.tags as Record<string, unknown>;
          if (tags[queryKey] !== queryVal) {
            // If you query for an unknown tag `m` that is not a part of the record with `{ m: undefined }` all items will match this query. This behaves differently in SQLite storage - this risk is accepted since we will only query for known tags and Ionic Storage is only used in development.
            return false;
          }
        }
      }
    }
    return true;
  }
}

export { IonicStorage };
