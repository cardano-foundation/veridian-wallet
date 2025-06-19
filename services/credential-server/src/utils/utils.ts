import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import {
  Operation,
  randomPasscode,
  Salter,
  Serder,
  SignifyClient,
  State,
} from "signify-ts";
import { config } from "../config";
import { ISSUER_NAME, QVI_NAME, QVI_SCHEMA_SAID } from "../consts";
import { BranFileContent } from "./utils.types";
import { EndRole } from "../server.types";

export const OP_TIMEOUT = 15000;
export const FAILED_TO_RESOLVE_OOBI =
  "Failed to resolve OOBI, operation not completing...";
export const REGISTRIES_NOT_FOUND = "No registries found for";

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

export async function waitAndGetDoneOp(
  client: SignifyClient,
  op: Operation,
  timeout = 10000,
  interval = 250
): Promise<Operation> {
  const startTime = new Date().getTime();
  while (!op.done && new Date().getTime() < startTime + timeout) {
    op = await client.operations().get(op.name);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  if (!op.done) {
    throw new Error(`Operation not completing: ${JSON.stringify(op, null, 2)}`);
  }
  return op;
}

export async function createQVICredential(
  client: SignifyClient,
  clientIssuer: SignifyClient,
  keriIssuerRegistryRegk: string
): Promise<string> {
  const issuerAid = await clientIssuer.identifiers().get(QVI_NAME);
  const holderAid = await client.identifiers().get(ISSUER_NAME);

  const issuerAidOobi = await getOobi(clientIssuer, issuerAid.name);
  const holderAidOobi = await getOobi(client, holderAid.name);

  await resolveOobi(client, issuerAidOobi);
  await resolveOobi(clientIssuer, holderAidOobi);

  await resolveOobi(
    clientIssuer,
    `${config.oobiEndpoint}/oobi/${QVI_SCHEMA_SAID}`
  );

  const vcdata = {
    LEI: "5493001KJTIIGC8Y1R17",
  };
  const result = await clientIssuer.credentials().issue(issuerAid.name, {
    ri: keriIssuerRegistryRegk,
    s: QVI_SCHEMA_SAID,
    a: {
      i: holderAid.prefix,
      ...vcdata,
    },
  });
  await waitAndGetDoneOp(clientIssuer, result.op, OP_TIMEOUT);
  const issuerCredential = await clientIssuer
    .credentials()
    .get(result.acdc.ked.d);
  const datetime = new Date().toISOString().replace("Z", "000+00:00");
  const [grant, gsigs, gend] = await clientIssuer.ipex().grant({
    senderName: issuerAid.name,
    recipient: holderAid.prefix,
    acdc: new Serder(issuerCredential.sad),
    anc: new Serder(issuerCredential.anc),
    iss: new Serder(issuerCredential.iss),
    ancAttachment: issuerCredential.ancAttachment,
    datetime,
  });
  const smg: Operation = await clientIssuer
    .ipex()
    .submitGrant(issuerAid.name, grant, gsigs, gend, [holderAid.prefix]);
  await waitAndGetDoneOp(clientIssuer, smg, OP_TIMEOUT);
  const qviCredentialId = result.acdc.ked.d;

  // wait for notification
  const getHolderNotifications = async () => {
    let holderNotifications = await client.notifications().list();

    while (!holderNotifications.total) {
      holderNotifications = await client.notifications().list();
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return holderNotifications;
  };

  const grantNotification = (await getHolderNotifications()).notes[0];

  // resolve schema
  await resolveOobi(client, `${config.oobiEndpoint}/oobi/${QVI_SCHEMA_SAID}`);

  // holder IPEX admit
  const [admit, sigs, aend] = await client.ipex().admit({
    senderName: holderAid.name,
    message: "",
    grantSaid: grantNotification.a.d!,
    recipient: issuerAid.prefix,
    datetime: new Date().toISOString().replace("Z", "000+00:00"),
  });
  const op: Operation = await client
    .ipex()
    .submitAdmit(holderAid.name, admit, sigs, aend, [issuerAid.prefix]);
  await waitAndGetDoneOp(client, op, OP_TIMEOUT);

  await client.notifications().delete(grantNotification.i);

  return qviCredentialId;
}

export async function resolveOobi(
  client: SignifyClient,
  url: string
): Promise<Operation> {
  const urlObj = new URL(url);
  const alias = urlObj.searchParams.get("name") ?? randomSalt();
  urlObj.searchParams.delete("name");
  const strippedUrl = urlObj.toString();

  const operation = (await waitAndGetDoneOp(
    client,
    await client.oobis().resolve(strippedUrl),
    OP_TIMEOUT
  )) as Operation & { response: State };
  if (!operation.done) {
    throw new Error(FAILED_TO_RESOLVE_OOBI);
  }
  if (operation.response && operation.response.i) {
    const connectionId = operation.response.i;
    const createdAt = new Date((operation.response as State).dt);
    await client.contacts().update(connectionId, {
      alias,
      createdAt,
      oobi: url,
    });
  }
  return operation;
}

export async function getRegistry(
  client: SignifyClient,
  name: string
): Promise<string> {
  const registries = await client.registries().list(name);
  if (!registries || registries.length === 0) {
    throw new Error(`${REGISTRIES_NOT_FOUND} ${name}`);
  }
  return registries[0].regk;
}

export async function getOobi(
  client: SignifyClient,
  signifyName: string
): Promise<string> {
  const result = await client.oobis().get(signifyName, EndRole.AGENT);
  return result.oobis[0];
}

export async function getEndRoles(
  client: SignifyClient,
  alias: string
): Promise<any> {
  const path = `/identifiers/${alias}/endroles`;
  const response: Response = await client.fetch(path, "GET", null);
  if (!response.ok) throw new Error(await response.text());
  const result = await response.json();
  return result;
}
