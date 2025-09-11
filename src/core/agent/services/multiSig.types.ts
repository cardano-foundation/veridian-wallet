import { MultisigThresholds } from "./identifier.types";

interface CommonExn {
  v: string;
  t: "exn";
  d: string;
  i: string;
  rp: string;
  p: string;
  dt: string;
  r: string;
  q: unknown;
}

interface IcpExn {
  v: string;
  t: string;
  d: string;
  i: string;
  s: string;
  kt: string | string[];
  k: string[];
  nt: string | string[];
  n: string[];
  bt: string;
  b: string[];
  c: string[];
  a: unknown[];
}

interface RotExn {
  v: string;
  t: string;
  d: string;
  i: string;
  s: string;
  kt: string | string[];
  k: string[];
  nt: string | string[];
  n: string[];
  bt: string;
  br: string[];
  ba: string[];
  a: unknown[];
}

interface InceptMultiSigExnMessage {
  exn: CommonExn & {
    a: {
      i: string;
      gid: string;
      smids: string[];
      rmids: string[];
    };
    e: {
      icp: IcpExn;
      d: string;
    };
  };
}

interface RotationMultiSigExnMessage {
  exn: CommonExn & {
    a: {
      i: string;
      gid: string;
      smids: string[];
      rmids: string[];
    };
    e: {
      rot: RotExn;
      d: string;
    };
  };
}

enum MultiSigRoute {
  EXN = "/multisig/exn",
  ICP = "/multisig/icp",
  IXN = "/multisig/ixn",
  RPY = "/multisig/rpy",
  ROT = "/multisig/rot",
}

interface IpexGrantMultiSigExn {
  exn: CommonExn & {
    a: {
      i: string;
      gid: string;
    };
    e: {
      exn: CommonExn & {
        a: {
          i: string;
          m: string;
        };
        e: {
          acdc: unknown; // @TODO - foconnor: We can type these.
          iss: unknown;
          anc: unknown;
          d: string;
        };
      };
      d: string;
    };
  };
}

interface IpexAdmitMultiSigRequest {
  exn: CommonExn & {
    a: {
      i: string;
      gid: string;
    };
    e: {
      exn: CommonExn & {
        a: {
          i: string;
          m: string;
        };
        e: Record<string, never>;
      };
      d: string;
    };
  };
  paths: {
    exn: string;
  };
}

interface GrantToJoinMultisigExnPayload {
  grantExn: IpexGrantMultiSigExn;
  atc: string;
}

/**
 * Information about a group member with their acceptance status
 */
interface GroupMemberInfo {
  /** Member's AID */
  aid: string;
  /** Whether the member has accepted to join the group */
  hasAccepted: boolean;
}

/**
 * Extended group information with acceptance and threshold details
 */
interface GroupInformation {
  threshold: MultisigThresholds;
  /** List of all members in the group */
  members: GroupMemberInfo[];
  /** Information about linked request */
  linkedRequest: {
    accepted: boolean;
    current?: string;
    previous?: string;
  };
}

export { MultiSigRoute };

export type {
  RotationMultiSigExnMessage,
  GrantToJoinMultisigExnPayload,
  IpexGrantMultiSigExn,
  InceptMultiSigExnMessage,
  IpexAdmitMultiSigRequest,
  GroupMemberInfo,
  GroupInformation,
};
