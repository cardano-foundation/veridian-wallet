import { NextFunction, Request, Response } from "express";
import { log } from "../log";
import { ACDC_SCHEMAS } from "../utils/schemas";
import {
  ISSUER_NAME,
  LE_SCHEMA_SAID,
  QVI_SCHEMA_SAID,
  RARE_EVO_DEMO_SCHEMA_SAID,
} from "../consts";
import { Operation, Saider, Serder, SignifyClient } from "signify-ts";
import {
  getRegistry,
  OP_TIMEOUT,
  resolveOobi,
  waitAndGetDoneOp,
} from "../utils/signify";
import {
  Credential,
  LeCredential,
  QviCredential,
} from "../utils/signifyApi.types";
import { config } from "../config";

export const UNKNOW_SCHEMA_ID = "Unknow Schema ID: ";
export const CREDENTIAL_NOT_FOUND = "Not found credential with ID: ";
export const CREDENTIAL_REVOKED_ALREADY =
  "The credential has been revoked already";

export async function issueAcdcCredential(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const client: SignifyClient = req.app.get("signifyClient");
  const qviCredentialId = req.app.get("qviCredentialId");

  const { schemaSaid, aid, attribute } = req.body;

  if (!ACDC_SCHEMAS[schemaSaid]) {
    res.status(409).send({
      success: false,
      data: "",
    });
    return;
  }

  const keriRegistryRegk = await getRegistry(client, ISSUER_NAME);
  const holderAid = await client.identifiers().get(ISSUER_NAME);

  if (schemaSaid === LE_SCHEMA_SAID) {
    await resolveOobi(client, `${config.oobiEndpoint}/oobi/${LE_SCHEMA_SAID}`);
    await resolveOobi(client, `${config.oobiEndpoint}/oobi/${QVI_SCHEMA_SAID}`);
    const qviCredential: QviCredential = await client
      .credentials()
      .get(qviCredentialId);

    const result = await client.credentials().issue(holderAid.name, {
      ri: keriRegistryRegk,
      s: LE_SCHEMA_SAID,
      a: {
        i: aid,
        ...attribute,
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
          n: qviCredential.sad.d,
          s: qviCredential.sad.s,
        },
      })[1],
    });

    const leCredential: LeCredential = await client
      .credentials()
      .get(result.acdc.ked.d);

    await waitAndGetDoneOp(client, result.op, OP_TIMEOUT);

    const [grant, gsigs, gend] = await client.ipex().grant({
      senderName: holderAid.name,
      acdc: new Serder(leCredential.sad),
      anc: new Serder(leCredential.anc),
      iss: new Serder(leCredential.iss),
      ancAttachment: leCredential.ancAttachment,
      recipient: aid,
      datetime: new Date().toISOString().replace("Z", "000+00:00"),
    });
    await client.ipex().submitGrant(holderAid.name, grant, gsigs, gend, [aid]);
    return result.acdc.ked.d;
  } else {
    let vcdata = {};
    if (
      schemaSaid === RARE_EVO_DEMO_SCHEMA_SAID ||
      schemaSaid === QVI_SCHEMA_SAID
    ) {
      vcdata = attribute;
    } else {
      throw new Error(UNKNOW_SCHEMA_ID + schemaSaid);
    }

    const result = await client.credentials().issue(ISSUER_NAME, {
      ri: keriRegistryRegk,
      s: schemaSaid,
      a: {
        i: aid,
        ...vcdata,
      },
    });
    await waitAndGetDoneOp(client, result.op, OP_TIMEOUT);

    const datetime = new Date().toISOString().replace("Z", "000+00:00");
    const [grant, gsigs, gend] = await client.ipex().grant({
      senderName: ISSUER_NAME,
      recipient: aid,
      acdc: result.acdc,
      iss: result.iss,
      anc: result.anc,
      datetime,
    });
    await client.ipex().submitGrant(ISSUER_NAME, grant, gsigs, gend, [aid]);
  }

  res.status(200).send({
    success: true,
    data: "Credential offered",
  });
}

export async function requestDisclosure(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const client: SignifyClient = req.app.get("signifyClient");
  const { schemaSaid, aid, attributes } = req.body;

  const [apply, sigs] = await client.ipex().apply({
    senderName: ISSUER_NAME,
    recipient: aid,
    schemaSaid,
    attributes,
  });
  await client.ipex().submitApply(ISSUER_NAME, apply, sigs, [aid]);

  res.status(200).send({
    success: true,
    data: "Apply schema successfully",
  });
}

export async function contactCredentials(
  req: Request,
  res: Response
): Promise<void> {
  const client: SignifyClient = req.app.get("signifyClient");
  const { contactId } = req.query;

  const issuer = await client.identifiers().get(ISSUER_NAME);

  const data = await client.credentials().list({
    filter: {
      "-i": issuer.prefix,
      "-a-i": contactId as string,
    },
  });

  res.status(200).send({
    success: true,
    data,
  });
}

export async function revokeCredential(
  req: Request,
  res: Response
): Promise<void> {
  const client: SignifyClient = req.app.get("signifyClient");
  const { credentialId, holder } = req.body;

  try {
    // TODO: If the credential does not exist, this will throw 500 at the moment. Will change this later
    let credential: Credential = await client
      .credentials()
      .get(credentialId)
      .catch(() => undefined);
    if (!credential) {
      throw new Error(`${CREDENTIAL_NOT_FOUND} ${credentialId}`);
    }
    if (credential.status.s === "1") {
      throw new Error(CREDENTIAL_REVOKED_ALREADY);
    }

    await client.credentials().revoke(ISSUER_NAME, credentialId);

    while (credential.status.s !== "1") {
      credential = await client
        .credentials()
        .get(credentialId)
        .catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    const datetime = new Date().toISOString().replace("Z", "000+00:00");
    const [grant, gsigs, gend] = await client.ipex().grant({
      senderName: ISSUER_NAME,
      recipient: holder,
      acdc: new Serder(credential.sad),
      anc: new Serder(credential.anc),
      iss: new Serder(credential.iss),
      datetime,
    });
    const submitGrantOp: Operation = await client
      .ipex()
      .submitGrant(ISSUER_NAME, grant, gsigs, gend, [holder]);
    await waitAndGetDoneOp(client, submitGrantOp, OP_TIMEOUT);
    res.status(200).send({
      success: true,
      data: "Revoke credential successfully",
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    log({ error: errorMessage });

    if (errorMessage === CREDENTIAL_REVOKED_ALREADY) {
      res.status(409).send({
        success: false,
        data: errorMessage,
      });
    } else if (new RegExp(`${CREDENTIAL_NOT_FOUND}`, "gi").test(errorMessage)) {
      res.status(404).send({
        success: false,
        data: errorMessage,
      });
    } else {
      res.status(500).send({
        success: false,
        data: errorMessage,
      });
    }
  }
}

export async function schemas(req: Request, res: Response) {
  const client: SignifyClient = req.app.get("signifyClient");

  const schemas = await client.schemas().list();
  res.status(200).send({
    success: true,
    data: schemas,
  });
}
