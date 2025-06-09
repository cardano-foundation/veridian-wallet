import { NextFunction, Request, Response } from "express";
import { log } from "../log";
import { SignifyApi } from "../modules/signify";
import { ACDC_SCHEMAS } from "../utils/schemas";
import { ISSUER_NAME, LE_SCHEMA_SAID } from "../consts";

export async function issueAcdcCredential(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const signifyApi: SignifyApi = req.app.get("signifyApi");
  const qviCredentialId = req.app.get("qviCredentialId");

  const { schemaSaid, aid, attribute } = req.body;

  if (!ACDC_SCHEMAS[schemaSaid]) {
    res.status(409).send({
      success: false,
      data: "",
    });
    return;
  }

  const keriRegistryRegk = await signifyApi.getRegistry(ISSUER_NAME);
  const holderAid = await signifyApi.getIdentifierByName(ISSUER_NAME);

  if (schemaSaid === LE_SCHEMA_SAID) {
    await signifyApi.leChainedCredential(
      qviCredentialId,
      keriRegistryRegk,
      holderAid.name,
      aid,
      attribute
    );
  } else {
    await signifyApi.issueCredential(
      ISSUER_NAME,
      keriRegistryRegk,
      schemaSaid,
      aid,
      attribute
    );
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
  const signifyApi: SignifyApi = req.app.get("signifyApi");
  const { schemaSaid, aid, attributes } = req.body;

  await signifyApi.requestDisclosure(ISSUER_NAME, schemaSaid, aid, attributes);
  res.status(200).send({
    success: true,
    data: "Apply schema successfully",
  });
}

export async function contactCredentials(
  req: Request,
  res: Response
): Promise<void> {
  const signifyApi: SignifyApi = req.app.get("signifyApi");
  const { contactId } = req.query;

  const issuer = await signifyApi.getIdentifierByName(ISSUER_NAME);

  const data = await signifyApi.contactCredentials(
    issuer.prefix,
    contactId as string
  );

  res.status(200).send({
    success: true,
    data,
  });
}

export async function revokeCredential(
  req: Request,
  res: Response
): Promise<void> {
  const signifyApi: SignifyApi = req.app.get("signifyApi");
  const { credentialId, holder } = req.body;

  try {
    await signifyApi.revokeCredential(ISSUER_NAME, holder, credentialId);
    res.status(200).send({
      success: true,
      data: "Revoke credential successfully",
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    log({ error: errorMessage });

    if (errorMessage === SignifyApi.CREDENTIAL_REVOKED_ALREADY) {
      res.status(409).send({
        success: false,
        data: errorMessage,
      });
    } else if (
      new RegExp(`${SignifyApi.CREDENTIAL_NOT_FOUND}`, "gi").test(errorMessage)
    ) {
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
  const signifyApi: SignifyApi = req.app.get("signifyApi");

  const schemas = await signifyApi.schemas();
  res.status(200).send({
    success: true,
    data: schemas,
  });
}
