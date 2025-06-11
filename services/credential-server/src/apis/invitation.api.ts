import { NextFunction, Request, Response } from "express";
import { ISSUER_NAME } from "../consts";
import { getOobi } from "../utils/utils";
import { SignifyClient } from "signify-ts";

export async function keriOobiApi(
  _: Request,
  res: Response,
  next: NextFunction
) {
  const client: SignifyClient = _.app.get("signifyClient");

  const url = `${await getOobi(
    client,
    ISSUER_NAME
  )}?name=CF%20Credential%20Issuance`;
  res.status(200).send({
    success: true,
    data: url,
  });
}
