import { Request, Response } from "express";

export function ping(_: Request, res: Response) {
  res.status(200).send("pong");
}
