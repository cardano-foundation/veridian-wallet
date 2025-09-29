import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import {
  Operation,
  randomPasscode,
  Saider,
  Salter,
  Serder,
  SignifyClient,
  State,
} from "signify-ts";
import { config } from "../config";
import {
  ISSUER_NAME,
  GLEIF_NAME,
  QVI_SCHEMA_SAID,
  LE_NAME,
  LE_SCHEMA_SAID,
  OOR_AUTH_SCHEMA_SAID,
} from "../consts";
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
      // Patch
      if (!data.leBran) {
        const newContent = { ...data, leBran: randomPasscode() };
        await writeFile(bransFilePath, JSON.stringify(newContent));
        return newContent;
      }

      return data;
    }
  }

  const bran = randomPasscode();
  const issuerBran = randomPasscode();
  const leBran = randomPasscode();
  const newContent = { bran, issuerBran, leBran };
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
  issuerClient: SignifyClient,
  holderClient: SignifyClient
): Promise<string> {
  const issuerAid = await issuerClient.identifiers().get(GLEIF_NAME);
  const holderAid = await holderClient.identifiers().get(ISSUER_NAME);

  const issued = await issuerClient
    .credentials()
    .list({
      filter: {
        "-i": issuerAid.prefix,
        "-s": QVI_SCHEMA_SAID,
        "-a-i": holderAid.prefix,
      },
    });
  if (issued.length) return issued[0].sad.d;

  const issuerAidOobi = await getOobi(issuerClient, issuerAid.name);
  const holderAidOobi = await getOobi(holderClient, holderAid.name);

  await resolveOobi(holderClient, issuerAidOobi);
  await resolveOobi(issuerClient, holderAidOobi);

  await resolveOobi(
    issuerClient,
    `${config.oobiEndpoint}/oobi/${QVI_SCHEMA_SAID}`
  );
  await resolveOobi(
    holderClient,
    `${config.oobiEndpoint}/oobi/${QVI_SCHEMA_SAID}`
  );

  const vcdata = {
    LEI: "5493001KJTIIGC8Y1R17",
  };
  const result = await issuerClient.credentials().issue(issuerAid.name, {
    ri: await getRegistry(issuerClient, GLEIF_NAME),
    s: QVI_SCHEMA_SAID,
    a: {
      i: holderAid.prefix,
      ...vcdata,
    },
  });

  await waitAndGetDoneOp(issuerClient, result.op, OP_TIMEOUT);
  const issuerCredential = await issuerClient
    .credentials()
    .get(result.acdc.ked.d);

  const datetime = new Date().toISOString().replace("Z", "000+00:00");
  const [grant, gsigs, gend] = await issuerClient.ipex().grant({
    senderName: issuerAid.name,
    recipient: holderAid.prefix,
    acdc: new Serder(issuerCredential.sad),
    anc: new Serder(issuerCredential.anc),
    iss: new Serder(issuerCredential.iss),
    ancAttachment: issuerCredential.ancAttachment,
    datetime,
  });
  const smg: Operation = await issuerClient
    .ipex()
    .submitGrant(issuerAid.name, grant, gsigs, gend, [holderAid.prefix]);
  await waitAndGetDoneOp(issuerClient, smg, OP_TIMEOUT);
  const qviCredentialId = result.acdc.ked.d;

  await new Promise((resolve) => setTimeout(resolve, 500));

  const [admit, sigs, aend] = await holderClient.ipex().admit({
    senderName: holderAid.name,
    message: "",
    grantSaid: grant.ked.d,
    recipient: issuerAid.prefix,
    datetime: new Date().toISOString().replace("Z", "000+00:00"),
  });
  const op: Operation = await holderClient
    .ipex()
    .submitAdmit(holderAid.name, admit, sigs, aend, [issuerAid.prefix]);
  await waitAndGetDoneOp(holderClient, op, OP_TIMEOUT);

  return qviCredentialId;
}

export async function createLECredential(
  issuerClient: SignifyClient,
  holderClient: SignifyClient,
  qviCredentialId: string
): Promise<string> {
  const issuerAid = await issuerClient.identifiers().get(ISSUER_NAME);
  const holderAid = await holderClient.identifiers().get(LE_NAME);

  const issued = await issuerClient
    .credentials()
    .list({
      filter: {
        "-i": issuerAid.prefix,
        "-s": LE_SCHEMA_SAID,
        "-a-i": holderAid.prefix,
      },
    });
  if (issued.length) return issued[0].sad.d;

  const issuerAidOobi = await getOobi(issuerClient, issuerAid.name);
  const holderAidOobi = await getOobi(holderClient, holderAid.name);

  await resolveOobi(issuerClient, holderAidOobi);
  await resolveOobi(holderClient, issuerAidOobi);

  await resolveOobi(
    issuerClient,
    `${config.oobiEndpoint}/oobi/${LE_SCHEMA_SAID}`
  );
  await resolveOobi(
    holderClient,
    `${config.oobiEndpoint}/oobi/${LE_SCHEMA_SAID}`
  );

  const vcdata = {
    LEI: "5493001KJTIIGC8Y1R17",
  };
  const result = await issuerClient.credentials().issue(issuerAid.name, {
    ri: await getRegistry(issuerClient, ISSUER_NAME),
    s: LE_SCHEMA_SAID,
    a: {
      i: holderAid.prefix,
      ...vcdata,
    },
    r: Saider.saidify({
      d: "",
      usageDisclaimer: {
        l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.",
      },
      issuanceDisclaimer: {
        l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.",
      },
    })[1],
    e: Saider.saidify({
      d: "",
      qvi: {
        n: qviCredentialId,
        s: QVI_SCHEMA_SAID,
      },
    })[1],
  });

  await waitAndGetDoneOp(issuerClient, result.op, OP_TIMEOUT);
  const issuerCredential = await issuerClient
    .credentials()
    .get(result.acdc.ked.d);

  const datetime = new Date().toISOString().replace("Z", "000+00:00");
  const [grant, gsigs, gend] = await issuerClient.ipex().grant({
    senderName: issuerAid.name,
    recipient: holderAid.prefix,
    acdc: new Serder(issuerCredential.sad),
    anc: new Serder(issuerCredential.anc),
    iss: new Serder(issuerCredential.iss),
    ancAttachment: issuerCredential.ancAttachment,
    datetime,
  });
  const smg: Operation = await issuerClient
    .ipex()
    .submitGrant(issuerAid.name, grant, gsigs, gend, [holderAid.prefix]);
  await waitAndGetDoneOp(issuerClient, smg, OP_TIMEOUT);
  const leCredentialId = result.acdc.ked.d;

  await new Promise((resolve) => setTimeout(resolve, 500));

  const [admit, sigs, aend] = await holderClient.ipex().admit({
    senderName: holderAid.name,
    message: "",
    grantSaid: grant.ked.d,
    recipient: issuerAid.prefix,
    datetime: new Date().toISOString().replace("Z", "000+00:00"),
  });
  const op: Operation = await holderClient
    .ipex()
    .submitAdmit(holderAid.name, admit, sigs, aend, [issuerAid.prefix]);
  await waitAndGetDoneOp(holderClient, op, OP_TIMEOUT);

  return leCredentialId;
}

export async function createOORAuthCredential(
  issuerClient: SignifyClient,
  holderClient: SignifyClient,
  leCredentialId: string
): Promise<string> {
  const issuerAid = await issuerClient.identifiers().get(LE_NAME);
  const holderAid = await holderClient.identifiers().get(ISSUER_NAME);

  const issued = await issuerClient
    .credentials()
    .list({
      filter: {
        "-i": issuerAid.prefix,
        "-s": OOR_AUTH_SCHEMA_SAID,
        "-a-i": holderAid.prefix,
      },
    });
  if (issued.length) return issued[0].sad.d;

  const issuerAidOobi = await getOobi(issuerClient, issuerAid.name);
  const holderAidOobi = await getOobi(holderClient, holderAid.name);

  await resolveOobi(issuerClient, holderAidOobi);
  await resolveOobi(holderClient, issuerAidOobi);

  await resolveOobi(
    issuerClient,
    `${config.oobiEndpoint}/oobi/${OOR_AUTH_SCHEMA_SAID}`
  );
  await resolveOobi(
    holderClient,
    `${config.oobiEndpoint}/oobi/${OOR_AUTH_SCHEMA_SAID}`
  );

  const vcdata = {
    LEI: "5493001KJTIIGC8Y1R17",
    AID: "aidhere",
    personLegalName: "John Doe",
    officialRole: "HR Manager",
  };
  const result = await issuerClient.credentials().issue(issuerAid.name, {
    ri: await getRegistry(issuerClient, LE_NAME),
    s: OOR_AUTH_SCHEMA_SAID,
    a: {
      i: holderAid.prefix,
      ...vcdata,
    },
    r: Saider.saidify({
      d: "",
      usageDisclaimer: {
        l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.",
      },
      issuanceDisclaimer: {
        l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.",
      },
    })[1],
    e: Saider.saidify({
      d: "",
      le: {
        n: leCredentialId,
        s: LE_SCHEMA_SAID,
      },
    })[1],
  });

  await waitAndGetDoneOp(issuerClient, result.op, OP_TIMEOUT);
  const issuerCredential = await issuerClient
    .credentials()
    .get(result.acdc.ked.d);

  const datetime = new Date().toISOString().replace("Z", "000+00:00");
  const [grant, gsigs, gend] = await issuerClient.ipex().grant({
    senderName: issuerAid.name,
    recipient: holderAid.prefix,
    acdc: new Serder(issuerCredential.sad),
    anc: new Serder(issuerCredential.anc),
    iss: new Serder(issuerCredential.iss),
    ancAttachment: issuerCredential.ancAttachment,
    datetime,
  });
  const smg: Operation = await issuerClient
    .ipex()
    .submitGrant(issuerAid.name, grant, gsigs, gend, [holderAid.prefix]);
  await waitAndGetDoneOp(issuerClient, smg, OP_TIMEOUT);
  const oorAuthCredentialId = result.acdc.ked.d;

  await new Promise((resolve) => setTimeout(resolve, 500));

  const [admit, sigs, aend] = await holderClient.ipex().admit({
    senderName: holderAid.name,
    message: "",
    grantSaid: grant.ked.d,
    recipient: issuerAid.prefix,
    datetime: new Date().toISOString().replace("Z", "000+00:00"),
  });
  const op: Operation = await holderClient
    .ipex()
    .submitAdmit(holderAid.name, admit, sigs, aend, [issuerAid.prefix]);
  await waitAndGetDoneOp(holderClient, op, OP_TIMEOUT);

  return oorAuthCredentialId;
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
