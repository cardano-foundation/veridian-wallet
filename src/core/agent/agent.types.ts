import { SignifyClient } from "signify-ts";
import {
  CredentialShortDetails,
  CredentialStatus,
} from "./services/credentialService.types";
import { EventService } from "./services/eventService";
import { IdentifierStorage } from "./records/identifierStorage";
import { CredentialStorage } from "./records/credentialStorage";
import { BasicStorage } from "./records/basicStorage";

enum Blockchain {
  CARDANO = "Cardano",
}

enum ConnectionStatus {
  CONFIRMED = "confirmed",
  PENDING = "pending",
  ACCEPTED = "accepted",
}

enum ConnectionHistoryType {
  CREDENTIAL_ACCEPTED,
}

interface ConnectionHistoryItem {
  type: ConnectionHistoryType;
  credentialType?: string;
  timestamp: string;
}

enum MiscRecordId {
  OP_PASS_HINT = "app-op-password-hint",
}

interface CryptoAccountRecordShortDetails {
  id: string;
  displayName: string;
  blockchain: Blockchain;
  totalADAinUSD: number;
  usesIdentitySeedPhrase: boolean;
}

interface ConnectionShortDetails {
  id: string;
  label: string;
  connectionDate: string;
  logo?: string;
  status: ConnectionStatus;
  oobi?: string;
}

type ConnectionNoteDetails = {
  id: string;
  title: string;
  message: string;
};

type ConnectionNoteProps = Pick<ConnectionNoteDetails, "title" | "message">;

interface ConnectionDetails extends ConnectionShortDetails {
  goalCode?: string;
  handshakeProtocols?: string[];
  requestAttachments?: string[];
  serviceEndpoints?: string[];
  notes?: ConnectionNoteDetails[];
}

enum ConnectionKeriEventTypes {
  ConnectionKeriStateChanged = "ConnectionKeriStateChanged",
}
enum AcdcKeriEventTypes {
  AcdcKeriStateChanged = "AcdcKeriStateChanged",
}
interface ConnectionKeriStateChangedEvent extends BaseEventEmitter {
  type: typeof ConnectionKeriEventTypes.ConnectionKeriStateChanged;
  payload: {
    connectionId?: string;
    status: ConnectionStatus;
  };
}

interface AcdcKeriStateChangedEvent extends BaseEventEmitter {
  type: typeof AcdcKeriEventTypes.AcdcKeriStateChanged;
  payload:
    | {
        status: CredentialStatus.PENDING;
        credentialId: string;
      }
    | {
        status: CredentialStatus.CONFIRMED;
        credential: CredentialShortDetails;
      };
}

interface KeriNotification {
  id: string;
  createdAt: Date;
  a: Record<string, unknown>;
}

interface BaseEventEmitter {
  type: string;
  payload: Record<string, unknown>;
}

interface KeriaNotificationMarker {
  nextIndex: number;
  lastNotificationId: string;
}

interface AgentServicesProps {
  basicStorage: BasicStorage;
  signifyClient: SignifyClient;
  eventService: EventService;
  identifierStorage: IdentifierStorage;
  credentialStorage: CredentialStorage;
}
enum MultiSigRoute {
  ROT = "/multisig/rot",
  ICP = "/multisig/icp",
  IXN = "/multisig/ixn",
}

interface CreateIdentifierResult {
  signifyName: string;
  identifier: string;
}

interface KeriContact {
  alias: string;
  id: string;
  oobi: string;
  challenges: string[];
  wellKnowns: string[];
}

interface IdentifierResult {
  name: string;
  prefix: string;
  salty: any;
}

interface IdentifiersListResult {
  aids: IdentifierResult[];
  start: 0;
  end: 0;
  total: 0;
}

interface CreateMultisigExnPayload {
  gid: string;
  smids: any[];
  rmids: any;
  rstates: any;
  name: string;
}

interface Aid {
  name: string;
  prefix: string;
  salty: any;
  transferable: boolean;
  state: {
    vn: number[];
    i: string;
    s: string;
    p: string;
    d: string;
    f: string;
    dt: string;
    et: string;
    kt: string;
    k: string[];
    nt: string;
    n: string[];
    bt: string;
    b: string[];
    c: string[];
    ee: {
      s: string;
      d: string;
      br: any[];
      ba: any[];
    };
    di: string;
  };
  windexes: number[];
}

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
      rstates: Aid["state"][];
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

enum NotificationRoute {
  Credential = "/exn/ipex/grant",
  MultiSigIcp = "/multisig/icp",
  MultiSigRot = "/multisig/rot",
}

enum OOBIScan {
  Delegated,
  Aid,
}

type ScanOOBIRes =
  | {
      oobiType: OOBIScan.Aid;
    }
  | {
      oobiType: OOBIScan.Delegated;
      delegatePrefix: string;
    };

export {
  Blockchain,
  ConnectionStatus,
  ConnectionHistoryType,
  MiscRecordId,
  ConnectionKeriEventTypes,
  AcdcKeriEventTypes,
  NotificationRoute,
  MultiSigRoute,
  OOBIScan,
};

export type {
  CryptoAccountRecordShortDetails,
  ConnectionShortDetails,
  ConnectionDetails,
  ConnectionNoteDetails,
  ConnectionNoteProps,
  ConnectionHistoryItem,
  ConnectionKeriStateChangedEvent,
  KeriNotification,
  AcdcKeriStateChangedEvent,
  BaseEventEmitter,
  KeriaNotificationMarker,
  AgentServicesProps,
  CreateIdentifierResult,
  KeriContact,
  IdentifiersListResult,
  CreateMultisigExnPayload,
  MultiSigExnMessage,
  Aid,
  IdentifierResult,
  ScanOOBIRes,
};
