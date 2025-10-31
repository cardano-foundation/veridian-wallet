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
          acdc: {
            d: string;
            i: string;
            s: string;
            [key: string]: unknown;
          };
          iss: unknown;
          anc: unknown;
          d: string;
        };
      };
      d: string;
    };
  };
  pathed: {
    exn: string;
  };
}

// Type guard for IpexGrantMultiSigExn
function isIpexGrantMultiSigExn(obj: unknown): obj is IpexGrantMultiSigExn {
  if (typeof obj !== "object" || obj === null) return false;

  const candidate = obj as {
    exn?: unknown;
    pathed?: unknown;
  };

  // Check pathed.exn is string
  if (
    typeof candidate.pathed !== "object" ||
    candidate.pathed === null ||
    typeof (candidate.pathed as { exn?: unknown }).exn !== "string"
  ) {
    return false;
  }

  // Check exn structure
  if (typeof candidate.exn !== "object" || candidate.exn === null) {
    return false;
  }

  const exn = candidate.exn as {
    e?: unknown;
  };

  // Check exn.e.exn exists
  if (typeof exn.e !== "object" || exn.e === null) {
    return false;
  }

  const e = exn.e as { exn?: unknown };
  return typeof e.exn === "object" && e.exn !== null;
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

// Extract the inner exn type from IpexGrantMultiSigExn
type InnerGrantExn = IpexGrantMultiSigExn["exn"]["e"]["exn"];

interface GrantToJoinMultisigExnPayload {
  grantExn: InnerGrantExn;
  atc: string;
}

interface GroupMemberInfo {
  aid: string;
  name: string;
  hasAccepted: boolean;
}

interface GroupInformation {
  threshold: MultisigThresholds;
  members: GroupMemberInfo[];
}

export { MultiSigRoute, isIpexGrantMultiSigExn };

export type {
  RotationMultiSigExnMessage,
  GrantToJoinMultisigExnPayload,
  IpexGrantMultiSigExn,
  InceptMultiSigExnMessage,
  IpexAdmitMultiSigRequest,
  GroupMemberInfo,
  GroupInformation,
};
