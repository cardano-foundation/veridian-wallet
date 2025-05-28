import { NextFunction, Request, Response } from "express";

async function contactList(_: Request, res: Response, next: NextFunction) {
  const signifyApi = res.app.get("signifyApi");

  const data = await signifyApi.contacts();
  res.status(200).send({
    success: true,
    data,
  });
}

async function deleteContact(req: Request, res: Response, next: NextFunction) {
  const signifyApi = res.app.get("signifyApi");
  const { id } = req.query;

  const data = await signifyApi.deleteContact(id);
  res.status(200).send({
    success: true,
    data,
  });
}

export { contactList, deleteContact };
