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

type EdgeNodeDetail = {
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
};

type EdgeNode =
  | EdgeNodeDetail
  | {
      oneOf: [{ description: string; type: string }, EdgeNodeDetail];
    };

type EdgeSectionDetail = {
  description: string;
  type: string;
  required: string[];
  properties: {
    d?: {
      description: string;
      type: string;
    };
    u?: {
      description: string;
      type: string;
    };
    o?: {
      description: string;
      type: string;
    };
    w?: {
      description: string;
      type: string;
    };
  } & Record<Exclude<string, "d" | "u" | "o" | "w">, EdgeNode>;
};

type EdgeSection =
  | EdgeSectionDetail
  | {
      oneOf: [{ description: string; type: string }, EdgeSectionDetail];
    };

export type {
  CredentialsMatchingApply,
  LinkedGroupInfo,
  SubmitIPEXResult,
  EdgeNode,
  EdgeSection,
};
