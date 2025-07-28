import { CreateIdentifierBody } from "signify-ts";
import {
  ConnectionShortDetails,
  MultisigConnectionDetails,
  CreationStatus,
  JSONObject,
} from "../agent.types";
import { IdentifierMetadataRecord } from "../records";

interface GroupMetadata {
  groupId: string;
  groupInitiator: boolean;
  groupCreated: boolean;
}

interface CreateIdentifierInputs {
  displayName: string;
  theme: number;
  groupMetadata?: GroupMetadata;
}

interface IdentifierShortDetails {
  id: string;
  displayName: string;
  createdAtUTC: string;
  theme: number;
  creationStatus: CreationStatus;
  groupMetadata?: GroupMetadata;
  groupMemberPre?: string;
}

interface IdentifierDetails extends IdentifierShortDetails {
  s: string;
  dt: string;
  kt: string | string[];
  k: string[];
  nt: string | string[];
  n: string[];
  bt: string;
  b: string[];
  di?: string;
  members?: string[];
}

interface MultiSigIcpRequestDetails {
  ourIdentifier: IdentifierShortDetails;
  sender: ConnectionShortDetails;
  otherConnections: ConnectionShortDetails[];
  threshold: number;
}

interface CreateIdentifierResult {
  identifier: string;
  createdAt: string;
}

enum IdentifierType {
  Individual = "individual",
  Group = "group",
}

type QueuedIdentifierCreation = {
  name: string;
  data: CreateIdentifierBody;
};

type QueuedGroupProps =
  | {
      initiator: true;
      groupConnections: MultisigConnectionDetails[];
      threshold: number;
    }
  | {
      initiator: false;
      notificationId: string;
      notificationSaid: string;
    };

type QueuedGroupCreation = QueuedIdentifierCreation & QueuedGroupProps;

interface GroupParticipants {
  ourIdentifier: IdentifierMetadataRecord;
  multisigMembers: any;
}

interface RemoteSignRequest {
  identifier: string;
  payload: JSONObject;
}

export type {
  IdentifierShortDetails,
  IdentifierDetails,
  MultiSigIcpRequestDetails,
  CreateIdentifierInputs,
  CreateIdentifierResult,
};

export { IdentifierType };
export type {
  QueuedIdentifierCreation,
  QueuedGroupProps,
  QueuedGroupCreation,
  GroupParticipants,
  RemoteSignRequest,
};
