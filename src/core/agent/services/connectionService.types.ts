import { CreationStatus, ExnMessage } from "../agent.types";

enum KeriaContactKeyPrefix {
  CONNECTION_NOTE = "note:",
  HISTORY_IPEX = "history:ipex:",
  HISTORY_REVOKE = "history:revoke:",
}

interface ConnectionHistoryItem {
  id: string;
  credentialType: string;
  historyType: ConnectionHistoryType;
  dt: string;
  connectionId: string;
}

interface ContactDetailsRecord {
  id: string;
  alias: string;
  createdAt: Date;
  oobi: string;
  groupId?: string;
  creationStatus?: CreationStatus;
  pendingDeletion?: boolean;
  identifier?: string;
}

enum ConnectionHistoryType {
  CREDENTIAL_ISSUANCE = "CREDENTIAL_ISSUANCE",
  CREDENTIAL_REQUEST_PRESENT = "CREDENTIAL_REQUEST_PRESENT",
  CREDENTIAL_REVOKED = "CREDENTIAL_REVOKED",
  CREDENTIAL_PRESENTED = "CREDENTIAL_PRESENTED",
  IPEX_AGREE_COMPLETE = "IPEX_AGREE_COMPLETE",
}

enum RpyRoute {
  INTRODUCE = "/introduce",
}

enum OobiQueryParams {
  NAME = "name",
  GROUP_ID = "groupId",
  GROUP_NAME = "groupName",
  ROLE = "role",
  EXTERNAL_ID = "externalId",
}

interface ExternalLink {
  t: string;
  a: string;
}

interface HumanReadableMessage {
  t: string;
  st: string;
  c: string[];
  l?: ExternalLink;
}

export {
  ConnectionHistoryType,
  KeriaContactKeyPrefix,
  RpyRoute,
  OobiQueryParams,
};

interface GetOobiParameters {
  alias?: string;
  groupId?: string;
  groupName?: string;
  externalId?: string;
}

export type {
  ConnectionHistoryItem,
  ContactDetailsRecord,
  ExnMessage,
  ExternalLink,
  HumanReadableMessage,
  GetOobiParameters,
};
