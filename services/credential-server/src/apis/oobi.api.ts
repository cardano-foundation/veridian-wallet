import { NextFunction, Request, Response } from "express";
import { SignifyClient } from "signify-ts";
import { resolveOobi as resolveOobiFromUtils } from "../utils/utils";

export async function resolveOobi(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const client: SignifyClient = req.app.get("signifyClient");
  const { oobi } = req.body;

  await resolveOobiFromUtils(client, oobi);
  res.status(200).send({
    success: true,
    data: "OOBI resolved successfully",
  });
}
