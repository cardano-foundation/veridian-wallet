import { ConnectionStatus } from "./agent.types";
import { KeriaNotification } from "./services/keriaNotificationService.types";
import { OperationPendingRecord } from "./records/operationPendingRecord";
import { OperationPendingRecordType } from "./records/operationPendingRecord.type";
import {
  CredentialShortDetails,
  CredentialStatus,
} from "./services/credentialService.types";
import { IdentifierShortDetails } from "./services/identifier.types";

interface BaseEventEmitter {
  type: string;
  payload: Record<string, unknown>;
}

enum EventTypes {
  NotificationAdded = "NotificationAdded",
  OperationComplete = "OperationComplete",
  OperationFailed = "OperationFailed",
  OperationAdded = "OperationAdded",
  ConnectionStateChanged = "ConnectionStateChanged",
  ConnectionRemoved = "ConnectionRemoved",
  AcdcStateChanged = "AcdcStateChanged",
  KeriaStatusChanged = "KeriaStatusChanged",
  NotificationRemoved = "NotificationRemoved",
  IdentifierRemoved = "IdentifierRemoved",
  CredentialRemovedEvent = "CredentialRemovedEvent",
  IdentifierAdded = "IdentifierAdded",
  GroupCreated = "GroupCreated",
  CoordinationCredentialsReqEvent = "CoordinationCredentialsReqEvent",
}

interface NotificationAddedEvent extends BaseEventEmitter {
  type: typeof EventTypes.NotificationAdded;
  payload: {
    note: KeriaNotification;
  };
}

interface OperationCompleteEvent extends BaseEventEmitter {
  type: typeof EventTypes.OperationComplete;
  payload: {
    oid: string;
    opType: OperationPendingRecordType;
  };
}

interface OperationFailedEvent extends BaseEventEmitter {
  type: typeof EventTypes.OperationFailed;
  payload: {
    oid: string;
    opType: OperationPendingRecordType;
  };
}

interface OperationAddedEvent extends BaseEventEmitter {
  type: typeof EventTypes.OperationAdded;
  payload: {
    operation: OperationPendingRecord;
  };
}

interface ConnectionStateChangedEvent extends BaseEventEmitter {
  type: typeof EventTypes.ConnectionStateChanged;
  payload: {
    isMultiSigInvite?: boolean;
    connectionId?: string;
    status: ConnectionStatus;
    url?: string;
    label?: string;
    identifier: string;
  };
}

interface ConnectionRemovedEvent extends BaseEventEmitter {
  type: typeof EventTypes.ConnectionRemoved;
  payload: {
    contactId: string;
    identifier: string;
  };
}

interface AcdcStateChangedEvent extends BaseEventEmitter {
  type: typeof EventTypes.AcdcStateChanged;
  payload: {
    status: CredentialStatus;
    credential: CredentialShortDetails;
  };
}

interface KeriaStatusChangedEvent extends BaseEventEmitter {
  type: typeof EventTypes.KeriaStatusChanged;
  payload: {
    isOnline: boolean;
  };
}

interface NotificationRemovedEvent extends BaseEventEmitter {
  type: typeof EventTypes.NotificationRemoved;
  payload: {
    id: string;
  };
}

interface IdentifierRemovedEvent extends BaseEventEmitter {
  type: typeof EventTypes.IdentifierRemoved;
  payload: {
    id: string;
  };
}

interface CredentialRemovedEvent extends BaseEventEmitter {
  type: typeof EventTypes.CredentialRemovedEvent;
  payload: {
    credentialId: string;
  };
}

interface IdentifierAddedEvent extends BaseEventEmitter {
  type: typeof EventTypes.IdentifierAdded;
  payload: {
    identifier: IdentifierShortDetails;
  };
}

interface GroupCreatedEvent extends BaseEventEmitter {
  type: typeof EventTypes.GroupCreated;
  payload: {
    group: IdentifierShortDetails;
  };
}

interface CoordinationCredentialsReqEvent extends BaseEventEmitter {
  type: typeof EventTypes.CoordinationCredentialsReqEvent;
  payload: {
    s: string;
  };
}

export type {
  NotificationAddedEvent,
  OperationCompleteEvent,
  OperationFailedEvent,
  BaseEventEmitter,
  ConnectionStateChangedEvent,
  AcdcStateChangedEvent,
  KeriaStatusChangedEvent,
  OperationAddedEvent,
  NotificationRemovedEvent,
  ConnectionRemovedEvent,
  IdentifierRemovedEvent,
  CredentialRemovedEvent,
  IdentifierAddedEvent,
  GroupCreatedEvent,
  CoordinationCredentialsReqEvent,
};
export { EventTypes };
