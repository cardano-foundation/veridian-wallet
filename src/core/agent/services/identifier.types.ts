import { CreateIdentifierBody, HabState } from "signify-ts";
import {
  MultisigConnectionDetails,
  CreationStatus,
  JSONObject,
} from "../agent.types";
import { IdentifierMetadataRecord } from "../records";

interface GroupMetadata {
  groupId: string;
  groupInitiator: boolean;
  groupCreated: boolean;
  userName: string;
  initiatorName?: string;
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
  sender: MultisigConnectionDetails;
  otherConnections: MultisigConnectionDetails[];
  signingThreshold: number;
  rotationThreshold: number;
}

interface CreateIdentifierResult {
  identifier: string;
  createdAt: string;
}

enum IdentifierType {
  Individual = "individual",
  Group = "group",
}

interface MultisigThresholds {
  signingThreshold: number;
  rotationThreshold: number;
}

// Discriminated union with proper type safety for group data
// Both initiator and joiner have group data when creating/joining a multisig
type QueuedGroupCreation =
  | {
      initiator: true;
      name: string;
      data: CreateIdentifierBody & { group: HabState };
      groupConnections: MultisigConnectionDetails[];
      threshold: number | MultisigThresholds;
    }
  | {
      initiator: false;
      name: string;
      data: CreateIdentifierBody & { group: HabState };
      notificationId: string;
      notificationSaid: string;
    };

// Helper type used in multiSigService for generating inception data
type QueuedGroupProps =
  | {
      initiator: true;
      groupConnections: MultisigConnectionDetails[];
      threshold: number | MultisigThresholds;
    }
  | {
      initiator: false;
      notificationId: string;
      notificationSaid: string;
    };

interface GroupParticipants {
  ourIdentifier: IdentifierMetadataRecord;
  multisigMembers: {
    signing: Array<{
      aid: string;
      ends: {
        agent: Record<string, { http: string }>;
        witness: Record<string, { http: string; tcp: string }>;
      };
    }>;
    rotation: Array<{
      aid: string;
      ends: {
        agent: Record<string, { http: string }>;
        witness: Record<string, { http: string; tcp: string }>;
      };
    }>;
  };
}

interface RemoteSignRequest {
  identifier: string;
  payload: JSONObject;
}

export { IdentifierType };

export type {
  IdentifierShortDetails,
  IdentifierDetails,
  MultiSigIcpRequestDetails,
  CreateIdentifierInputs,
  CreateIdentifierResult,
  MultisigThresholds,
  GroupMetadata,
  QueuedGroupProps,
  QueuedGroupCreation,
  GroupParticipants,
  RemoteSignRequest,
};
