import { Request, Response } from "express";
import { SignifyClient } from "signify-ts";

export async function schemaApi(req: Request, res: Response) {
  const client: SignifyClient = req.app.get("signifyClient");

  const schemas = await client.schemas().list();
  res.status(200).send({
    success: true,
    data: schemas,
  });
}
