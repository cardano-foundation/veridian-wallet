import { Salter } from "signify-ts";
import { BranFileContent } from "./utils.types";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { randomPasscode } from "signify-ts";

export function randomSalt(): string {
  return new Salter({}).qb64;
}

export async function loadBrans(): Promise<BranFileContent> {
  const bransFilePath = "./data/brans.json";
  const dirPath = path.dirname(bransFilePath);

  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }

  let bransFileContent = "";
  if (existsSync(bransFilePath)) {
    bransFileContent = await readFile(bransFilePath, "utf8");
    const data = JSON.parse(bransFileContent);
    if (data.bran && data.issuerBran) {
      return data;
    }
  }

  const bran = randomPasscode();
  const issuerBran = randomPasscode();
  const newContent = { bran, issuerBran };
  await writeFile(bransFilePath, JSON.stringify(newContent));
  return newContent;
}
