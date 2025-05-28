import { SignifyClient } from "signify-ts";
import { CoreEventEmitter } from "./event";
import { ConnectionHistoryType } from "./services/connectionService.types";

enum ConnectionStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  FAILED = "failed",
  DELETED = "deleted",
}

interface ConnectionHistoryItem {
  id: string;
  type: ConnectionHistoryType;
  timestamp: string;
  credentialType?: string;
}

enum MiscRecordId {
  OP_PASS_HINT = "op-password-hint",
  APP_ALREADY_INIT = "app-already-init",
  APP_STATE_FLAGS = "app-state-flags",
  APP_LANGUAGE = "app-language",
  IDENTIFIERS_FAVOURITES = "identifiers-favourites",
  CREDS_FAVOURITES = "creds-favourites",
  USER_NAME = "user-name",
  APP_BIOMETRY = "app-biometry",
  KERIA_NOTIFICATION_MARKER = "keria-notification-marker",
  APP_IDENTIFIER_VIEW_TYPE = "app-identifier-view-type",
  APP_CRED_VIEW_TYPE = "app-cred-view-type",
  APP_IDENTIFIER_SELECTED_FILTER = "app-identifier-selected-filter",
  APP_CRED_SELECTED_FILTER = "app-cred-selected-filter",
  KERIA_CONNECT_URL = "keria-connect-url",
  KERIA_BOOT_URL = "keria-boot-url",
  APP_IDENTIFIER_FAVOURITE_INDEX = "identifier-favourite-index",
  APP_CRED_FAVOURITE_INDEX = "cred-favourite-index",
  APP_PASSWORD_SKIPPED = "app-password-skipped",
  APP_RECOVERY_WALLET = "recovery-wallet",
  LOGIN_METADATA = "login-metadata",
  CAMERA_DIRECTION = "camera-direction",
  FAILED_NOTIFICATIONS = "failed-notifications",
  CLOUD_RECOVERY_STATUS = "cloud-recovery-status",
  IDENTIFIERS_PENDING_CREATION = "identifiers-pending-creation",
  MULTISIG_IDENTIFIERS_PENDING_CREATION = "multisig-identifiers-pending-creation",
  APP_FIRST_INSTALL = "app-first-install",
  INDIVIDUAL_FIRST_CREATE = "individual-first-create",
  BIOMETRICS_SETUP = "biometrics-setup",
}

interface ConnectionShortDetails {
  id: string;
  label: string;
  createdAtUTC: string;
  status: ConnectionStatus;
  logo?: string;
  oobi?: string;
  groupId?: string;
}

type ConnectionNoteDetails = {
  id: string;
  title: string;
  message: string;
};

interface JSONObject {
  [x: string]: JSONValue;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface JSONArray extends Array<JSONValue> {}

type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | JSONArray;

type ExnMessage = {
  exn: {
    v: string;
    t: string;
    d: string;
    i: string;
    p: string;
    dt: string;
    r: string;
    q: JSONValue;
    a: any;
    e: any;
    rp: string;
  };
  pathed: {
    acdc?: string;
    iss?: string;
    anc?: string;
    exn?: string;
  };
};

type ConnectionNoteProps = Pick<ConnectionNoteDetails, "title" | "message">;

interface ConnectionDetails extends ConnectionShortDetails {
  serviceEndpoints: string[];
  notes: ConnectionNoteDetails[];
  historyItems: ConnectionHistoryItem[];
}

interface NotificationRpy {
  a: {
    cid: string;
    eid: string;
    role: string;
  };
  d: string;
  dt: string;
  r: string;
  t: string;
  v: string;
}

interface AuthorizationRequestExn {
  a: { gid: string };
  e: { rpy: NotificationRpy; d: string };
}

enum OobiType {
  NORMAL = "NORMAL",
  MULTI_SIG_INITIATOR = "MULTI_SIG_INITIATOR",
}

type OobiScan =
  | { type: OobiType.NORMAL; connection: ConnectionShortDetails }
  | {
      type: OobiType.MULTI_SIG_INITIATOR;
      groupId: string;
      connection: ConnectionShortDetails;
    };

interface AgentServicesProps {
  signifyClient: SignifyClient;
  eventEmitter: CoreEventEmitter;
}

interface AgentUrls {
  url: string;
  bootUrl: string;
}

interface BranAndMnemonic {
  bran: string;
  mnemonic: string;
}

enum CreationStatus {
  PENDING = "PENDING",
  COMPLETE = "COMPLETE",
  FAILED = "FAILED",
}

export const OOBI_RE =
  /^\/oobi\/(?<cid>[^/]+)\/(?<role>[^/]+)(?:\/(?<eid>[^/]+))?$/i;
export const OOBI_AGENT_ONLY_RE =
  /^\/oobi\/(?<cid>[^/]+)\/agent(?:\/(?<eid>[^/]+))?$/i;
export const DOOBI_RE = /^\/oobi\/(?<said>[^/]+)$/i;
export const WOOBI_RE = /^\/\.well-known\/keri\/oobi\/(?<cid>[^/]+)$/;

export { ConnectionStatus, MiscRecordId, OobiType, CreationStatus };

export type {
  ConnectionShortDetails,
  ConnectionDetails,
  ConnectionNoteDetails,
  ConnectionNoteProps,
  ConnectionHistoryItem,
  OobiScan,
  AgentServicesProps,
  AgentUrls,
  BranAndMnemonic,
  ExnMessage,
  NotificationRpy,
  AuthorizationRequestExn,
  JSONValue,
  JSONObject,
};
