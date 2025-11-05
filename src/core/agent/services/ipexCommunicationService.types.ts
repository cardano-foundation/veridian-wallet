import { Operation } from "signify-ts";
import { LinkedRequest } from "../records/notificationRecord.types";
import { JSONObject } from "../agent.types";
import { MultisigThresholds } from "./identifier.types";
import { ACDC } from "./credentialService.types";

interface CredentialsMatchingApply {
  schema: {
    name: string;
    description: string;
  };
  credentials: {
    connectionId: string;
    acdc: ACDC;
  }[];
  attributes: JSONObject;
  identifier: string;
}

interface LinkedGroupInfo {
  threshold: MultisigThresholds;
  members: string[];
  othersJoined: string[];
  linkedRequest: LinkedRequest;
}

interface SubmitIPEXResult {
  op: Operation;
  exnSaid: string;
}

export type { CredentialsMatchingApply, LinkedGroupInfo, SubmitIPEXResult };
