import { NextFunction, Request, Response } from "express";
import { Operation, Saider, Serder, SignifyClient } from "signify-ts";
import { ACDC_SCHEMAS_ID, ISSUER_NAME, LE_SCHEMA_SAID } from "../consts";
import { getRegistry, OP_TIMEOUT, waitAndGetDoneOp } from "../utils/utils";
import { QviCredential } from "../utils/utils.types";

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

  if (!ACDC_SCHEMAS_ID.some((schemaId) => schemaId === schemaSaid)) {
    res.status(409).send({
      success: false,
      data: "",
    });
    return;
  }

  const keriRegistryRegk = await getRegistry(client, ISSUER_NAME);
  const holderAid = await client.identifiers().get(ISSUER_NAME);

  let issueParams: any;
  let grantParams: any;

  if (schemaSaid === LE_SCHEMA_SAID) {
    const qviCredential: QviCredential = await client
      .credentials()
      .get(qviCredentialId);

    issueParams = {
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
    };

    grantParams = {
      senderName: holderAid.name,
      recipient: aid,
      ancAttachment: true,
    };
  } else {
    issueParams = {
      ri: keriRegistryRegk,
      s: schemaSaid,
      a: {
        i: aid,
        ...attribute,
      },
    };

    grantParams = {
      senderName: ISSUER_NAME,
      recipient: aid,
    };
  }

  const issuerName =
    schemaSaid === LE_SCHEMA_SAID ? holderAid.name : ISSUER_NAME;
  const result = await client.credentials().issue(issuerName, issueParams);
  await waitAndGetDoneOp(client, result.op, OP_TIMEOUT);

  const credential = await client.credentials().get(result.acdc.ked.d);
  const datetime = new Date().toISOString().replace("Z", "000+00:00");
  const [grant, gsigs, gend] = await client.ipex().grant({
    ...grantParams,
    acdc: new Serder(credential.sad),
    anc: new Serder(credential.anc),
    iss: new Serder(credential.iss),
    ancAttachment: credential.ancatc?.[0],
    datetime,
  });

  await client
    .ipex()
    .submitGrant(grantParams.senderName, grant, gsigs, gend, [aid]);

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

  // Get the credential first
  let credential = await client
    .credentials()
    .get(credentialId)
    .catch((error) => {
      const status = error.message.split(" - ")[1];
      if (/404/gi.test(status)) {
        res.status(404).send({
          success: false,
          data: `${CREDENTIAL_NOT_FOUND} ${credentialId}`,
        });
      } else {
        throw error;
      }
    });

  // Handle already revoked credential
  if (credential.status.s === "1") {
    res.status(409).send({
      success: false,
      data: CREDENTIAL_REVOKED_ALREADY,
    });
    return;
  }

  // Proceed with revocation
  await client.credentials().revoke(ISSUER_NAME, credentialId);

  while (credential.status.s !== "1") {
    credential = await client.credentials().get(credentialId);
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
    ancAttachment: credential.ancatc?.[0],
  });
  const submitGrantOp: Operation = await client
    .ipex()
    .submitGrant(ISSUER_NAME, grant, gsigs, gend, [holder]);
  await waitAndGetDoneOp(client, submitGrantOp, OP_TIMEOUT);

  res.status(200).send({
    success: true,
    data: "Revoke credential successfully",
  });
}
