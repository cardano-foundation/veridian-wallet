/**
 * Utility functions for migrations
 */

/**
 * Creates SQL statements to insert item tags into the items_tags table
 * @param itemRecord The record containing tags to insert
 * @returns Array of SQL statements with values for inserting tags
 */
export function createInsertItemTagsStatements(
  itemRecord: any
): { statement: string; values?: unknown[] }[] {
  const statements: { statement: string; values?: unknown[] }[] = [];
  const statement =
    "INSERT INTO items_tags (item_id, name, value, type) VALUES (?,?,?,?)";
  const tags = itemRecord.tags;

  if (!tags) {
    return statements;
  }

  for (const key of Object.keys(tags)) {
    if (tags[key] === undefined || tags[key] === null) continue;

    if (typeof tags[key] === "boolean") {
      statements.push({
        statement: statement,
        values: [itemRecord.id, key, tags[key] ? "1" : "0", "boolean"],
      });
    } else if (typeof tags[key] === "string") {
      statements.push({
        statement: statement,
        values: [itemRecord.id, key, tags[key], "string"],
      });
    }
  }

  return statements;
}

/**
 * Creates SQL statement to insert an item into the items table
 * @param record The record to insert
 * @returns SQL statement with values for inserting the item
 */
export function createInsertItemStatement(record: any): {
  statement: string;
  values?: unknown[];
} {
  return {
    statement:
      "INSERT INTO items (id, category, name, value) VALUES (?, ?, ?, ?)",
    values: [record.id, record.type, record.id, JSON.stringify(record)],
  };
}
