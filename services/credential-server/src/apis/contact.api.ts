import { NextFunction, Request, Response } from "express";
import { SignifyClient } from "signify-ts";

export async function contactList(
  _: Request,
  res: Response,
  next: NextFunction
) {
  const client: SignifyClient = res.app.get("signifyClient");

  // @TODO - foconnor: Temporary hack to add createdAt after one-way scan, doing this now
  // to avoid updating keripy and making a change which might make backwards compatability or migrations harder later.
  const contacts = await client.contacts().list();
  for (const contact of contacts) {
    if (!contact.createdAt) {
      contact.createdAt = new Date();
      client.contacts().update(contact.id, {
        createdAt: contact.createdAt,
      });
    }
  }

  res.status(200).send({
    success: true,
    data: contacts,
  });
}

export async function deleteContact(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const client: SignifyClient = res.app.get("signifyClient");
  const { id } = req.query;

  const data = await client.contacts().delete(id as string);
  res.status(200).send({
    success: true,
    data,
  });
}
