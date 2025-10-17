import { Operation } from "signify-ts";
import { LinkedRequest } from "../records/notificationRecord.types";
import { JSONObject } from "../agent.types";
import { MultisigThresholds } from "./identifier.types";
interface CredentialsMatchingApply {
  schema: {
    name: string;
    description: string;
  };
  credentials: {
    connectionId: string;
    // @TODO: Use narrower ACDC type from Patrick's types for KERIA/Signify when available
    acdc: Record<string, unknown>;
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
