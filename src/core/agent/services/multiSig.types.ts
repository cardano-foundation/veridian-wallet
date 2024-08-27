import { HabState, State } from "signify-ts";

interface MultiSigExnMessage {
  exn: {
    v: string;
    t: string;
    d: string;
    i: string;
    p: string;
    dt: string;
    r: string;
    q: any;
    a: {
      gid: string;
      smids: string[];
      rmids: string[];
      rstates: HabState["state"][];
      name: string;
    };
    e: {
      icp: {
        v: string;
        t: string;
        d: string;
        i: string;
        s: string;
        kt: string;
        k: string[];
        nt: string;
        n: string[];
        bt: string;
        b: string[];
        c: any[];
        a: any[];
      };
      d: string;
    };
  };
}

interface CreateMultisigExnPayload {
  gid: string;
  smids: string[];
  rmids: string[];
  rstates: State[];
  name: string;
}

interface AuthorizationExnPayload {
  gid: string;
}

enum MultiSigRoute {
  EXN = "/multisig/exn",
  ICP = "/multisig/icp",
  IXN = "/multisig/ixn",
  RPY = "/multisig/rpy",
  ROT = "/multisig/rot",
}

export { MultiSigRoute };

interface GrantMultiSigExnMessage {
  exn: {
    v: string;
    t: string;
    d: string;
    i: string;
    rp: string;
    p: string;
    dt: string;
    r: string;
    q: any;
    a: {
      gid: string;
      i: string;
    };
    e: {
      exn: {
        v: string;
        t: string;
        d: string;
        i: string;
        rp: string;
        p: string;
        dt: string;
        r: string;
        q: any;
        a: {
          i: string;
          m: string;
        };
        e: {
          acdc: any;
          iss: any;
          anc: any;
          d: string;
        };
      };
      d: string;
    };
  };
}

interface GrantToJoinMultisigExnPayload {
  grantExn: GrantMultiSigExnMessage;
  atc: {
    exn: string;
  };
}

export type {
  MultiSigExnMessage,
  CreateMultisigExnPayload,
  AuthorizationExnPayload,
  GrantMultiSigExnMessage,
  GrantToJoinMultisigExnPayload,
};
