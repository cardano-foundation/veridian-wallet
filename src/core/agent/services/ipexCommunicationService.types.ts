import { Operation } from "signify-ts";
import { LinkedRequest } from "../records/notificationRecord.types";
import { JSONObject } from "../agent.types";
interface CredentialsMatchingApply {
  schema: {
    name: string;
    description: string;
  };
  credentials: {
    connectionId: string;
    acdc: any;
  }[];
  attributes: JSONObject;
  identifier: string;
}

interface LinkedGroupInfo {
  threshold: string | string[];
  members: string[];
  othersJoined: string[];
  linkedRequest: LinkedRequest;
}

interface SubmitIPEXResult {
  op: Operation;
  exnSaid: string;
}

interface SchemaEdge {
  description: string;
  type: string;
  properties: {
    n: {
      description: string;
      type: string;
      const?: string;
    };
    s: {
      description: string;
      type: string;
      const?: string;
    };
  };
  additionalProperties: boolean;
  required: string[];
}

export type {
  CredentialsMatchingApply,
  LinkedGroupInfo,
  SubmitIPEXResult,
  SchemaEdge,
};
