import { NextFunction, Request, Response } from "express";

export async function resolveOobi(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signifyApi: any = req.app.get("signifyApi");
  const { oobi } = req.body;

  await signifyApi.resolveOobi(oobi);
  res.status(200).send({
    success: true,
    data: "OOBI resolved successfully",
  });
}
