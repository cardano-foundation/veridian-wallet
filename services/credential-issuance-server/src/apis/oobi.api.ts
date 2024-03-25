import { Request, Response } from "express";
import { Agent } from "../ariesAgent";
import { ResponseData } from "../types/response.type";
import { httpResponse } from "../utils/response.util";

async function resolveOobi(req: Request, res: Response) {
  const { oobi } = req.body;
  await Agent.agent.resolveOobi(oobi);
  const response: ResponseData<string> = {
    statusCode: 200,
    success: true,
    data: "OOBI resolved successfully",
  };
  httpResponse(res, response);
}

export { resolveOobi };
