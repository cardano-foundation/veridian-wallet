enum NotificationRoute {
  // "Real" notifications from KERIA
  MultiSigIcp = "/multisig/icp",
  MultiSigExn = "/multisig/exn",
  MultiSigRpy = "/multisig/rpy",
  ExnIpexApply = "/exn/ipex/apply",
  ExnIpexOffer = "/exn/ipex/offer",
  ExnIpexAgree = "/exn/ipex/agree",
  ExnIpexGrant = "/exn/ipex/grant",
  RemoteSignReq = "/exn/remotesign/ixn/req",
  HumanReadableMessage = "/exn/hmessage",
  // Notifications from our wallet to give further feedback to the user
  LocalAcdcRevoked = "/local/acdc/revoked",
  LocalSingletonConnectInstructions = "/local/singleton/connectinstructions",
}

enum ExchangeRoute {
  IpexAdmit = "/ipex/admit",
  IpexGrant = "/ipex/grant",
  IpexApply = "/ipex/apply",
  IpexAgree = "/ipex/agree",
  IpexOffer = "/ipex/offer",
  RemoteSignRef = "/remotesign/ixn/ref",
}

interface KeriaNotification {
  id: string;
  createdAt: string;
  a: Record<string, unknown>;
  connectionId: string;
  read: boolean;
  groupReplied: boolean;
  groupInitiatorPre?: string;
  groupInitiator?: boolean;
}

interface KeriaNotificationMarker {
  nextIndex: number;
  lastNotificationId: string;
}

interface Notification {
  i: string;
  dt: string;
  r: boolean;
  a: {
    r: string;
    d: string;
    m?: string;
  };
}

export { NotificationRoute, ExchangeRoute };
export type { KeriaNotification, KeriaNotificationMarker, Notification };
