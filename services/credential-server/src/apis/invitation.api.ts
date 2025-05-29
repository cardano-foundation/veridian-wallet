import { NextFunction, Request, Response } from "express";
import { HOLDER_AID_NAME } from "../consts";

async function keriOobiApi(_: Request, res: Response, next: NextFunction) {
  const signifyApi: any = res.app.get("signifyApi");
  const url = `${await signifyApi.getOobi(
    HOLDER_AID_NAME
  )}?name=CF%20Credential%20Issuance`;
  res.status(200).send({
    success: true,
    data: url,
  });
}

export { keriOobiApi };
