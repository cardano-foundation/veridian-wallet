import { ConnectionStatus, KeriaNotification } from "./agent.types";
import { IdentifierMetadataRecordProps } from "./records";
import { OperationPendingRecord } from "./records/operationPendingRecord";
import { OperationPendingRecordType } from "./records/operationPendingRecord.type";
import {
  CredentialShortDetails,
  CredentialStatus,
} from "./services/credentialService.types";

interface BaseEventEmitter {
  type: string;
  payload: Record<string, unknown>;
}

enum EventTypes {
  NotificationAdded = "NotificationAdded ",
  OperationComplete = "OperationComplete",
  OperationAdded = "OperationAdded",
  ConnectionStateChanged = "ConnectionStateChanged",
  ConnectionRemoved = "ConnectionRemoved",
  AcdcStateChanged = "AcdcStateChanged",
  KeriaStatusChanged = "KeriaStatusChanged",
  NotificationRemoved = "NotificationRemoved",
  IdentifierRemoved = "IdentifierRemoved",
  IdentifierAdded = "IdentifierAdded",
}

interface NotificationAddedEvent extends BaseEventEmitter {
  type: typeof EventTypes.NotificationAdded;
  payload: {
    keriaNotif: KeriaNotification;
  };
}

interface OperationCompleteEvent extends BaseEventEmitter {
  type: typeof EventTypes.OperationComplete;
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
  };
}

interface ConnectionRemovedEvent extends BaseEventEmitter {
  type: typeof EventTypes.ConnectionRemoved;
  payload: {
    connectionId: string;
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
    keriaNotif: KeriaNotification;
  };
}

interface IdentifierRemovedEvent extends BaseEventEmitter {
  type: typeof EventTypes.IdentifierRemoved;
  payload: {
    id: string;
  };
}

interface IdentifierAddedEvent extends BaseEventEmitter {
  type: typeof EventTypes.IdentifierAdded;
  payload: {
    identifier: IdentifierMetadataRecordProps;
  };
}

export type {
  NotificationAddedEvent,
  OperationCompleteEvent,
  BaseEventEmitter,
  ConnectionStateChangedEvent,
  AcdcStateChangedEvent,
  KeriaStatusChangedEvent,
  OperationAddedEvent,
  NotificationRemovedEvent,
  ConnectionRemovedEvent,
  IdentifierRemovedEvent,
  IdentifierAddedEvent,
};
export { EventTypes };
