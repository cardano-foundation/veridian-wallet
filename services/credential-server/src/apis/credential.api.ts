import { NextFunction, Request, Response } from "express";
import { Agent } from "../agent";
import { log } from "../log";
import { SignifyApi } from "../modules/signify";
import { ACDC_SCHEMAS } from "../utils/schemas";

async function issueAcdcCredential(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { schemaSaid, aid, attribute } = req.body;
  if (!ACDC_SCHEMAS[schemaSaid]) {
    res.status(409).send({
      success: false,
      data: "",
    });
  }
  await Agent.agent.issueAcdcCredentialByAid(schemaSaid, aid, attribute);
  res.status(200).send({
    success: true,
    data: "Credential offered",
  });
}

async function requestDisclosure(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { schemaSaid, aid, attributes } = req.body;
  await Agent.agent.requestDisclosure(schemaSaid, aid, attributes);
  res.status(200).send({
    success: true,
    data: "Apply schema successfully",
  });
}

async function contactCredentials(req: Request, res: Response): Promise<void> {
  const { contactId } = req.query;
  const data = await Agent.agent.contactCredentials(contactId as string);

  res.status(200).send({
    success: true,
    data,
  });
}

async function revokeCredential(req: Request, res: Response): Promise<void> {
  const { credentialId, holder } = req.body;

  try {
    await Agent.agent.revokeCredential(credentialId, holder);
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

async function schemas(req: Request, res: Response) {
  const schemas = await Agent.agent.schemas();
  res.status(200).send({
    success: true,
    data: schemas,
  });
}

export {
  contactCredentials,
  issueAcdcCredential,
  requestDisclosure,
  revokeCredential,
  schemas,
};
