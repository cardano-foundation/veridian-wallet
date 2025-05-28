import { NextFunction, Request, Response } from "express";
import { Agent } from "../agent";

async function keriOobiApi(_: Request, res: Response, next: NextFunction) {
  const url = await Agent.agent.createKeriOobi();
  res.status(200).send({
    success: true,
    data: url,
  });
}

export { keriOobiApi };
