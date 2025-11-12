import { Agent } from "../../../core/agent/agent";
import {
  CreationStatus,
  isRegularConnectionDetails,
} from "../../../core/agent/agent.types";
import {
  EventTypes,
  GroupCreatedEvent,
  IdentifierAddedEvent,
  NotificationAddedEvent,
  NotificationRemovedEvent,
} from "../../../core/agent/event.types";
import { OperationPendingRecordType } from "../../../core/agent/records/operationPendingRecord.type";
import { useAppDispatch } from "../../../store/hooks";
import {
  addGroupProfileAsync,
  addNotification,
  addOrUpdateProfileIdentity,
  deleteNotificationById,
  handleNotificationReceived,
  updateOrAddConnectionCache,
  updateProfileCreationStatus,
} from "../../../store/reducers/profileCache";
import { setToastMsg } from "../../../store/reducers/stateCache";
import { ToastMsgType } from "../../globals/types";

const notificationStateChanged = (
  event: NotificationRemovedEvent | NotificationAddedEvent,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  switch (event.type) {
    case EventTypes.NotificationAdded:
      dispatch(addNotification(event.payload.note));
      dispatch(handleNotificationReceived(event.payload.note));
      break;
    case EventTypes.NotificationRemoved:
      dispatch(deleteNotificationById(event.payload.id));
      break;
    default:
      break;
  }
};

const operationCompleteHandler = async (
  { oid, opType }: { oid: string; opType: OperationPendingRecordType },
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  switch (opType) {
    case OperationPendingRecordType.Witness:
    case OperationPendingRecordType.Group:
      dispatch(
        updateProfileCreationStatus({
          id: oid,
          creationStatus: CreationStatus.COMPLETE,
        })
      );
      dispatch(setToastMsg(ToastMsgType.IDENTIFIER_UPDATED));
      break;
  }
};

const operationFailureHandler = async (
  { oid, opType }: { oid: string; opType: OperationPendingRecordType },
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  switch (opType) {
    case OperationPendingRecordType.Witness: {
      dispatch(
        updateProfileCreationStatus({
          id: oid,
          creationStatus: CreationStatus.FAILED,
        })
      );
      dispatch(setToastMsg(ToastMsgType.IDENTIFIER_UPDATED));
      break;
    }
    case OperationPendingRecordType.Oobi: {
      const connectionDetails =
        await Agent.agent.connections.getConnectionShortDetailById(oid);
      if (isRegularConnectionDetails(connectionDetails)) {
        dispatch(updateOrAddConnectionCache(connectionDetails));
      }
      break;
    }
    default: {
      break;
    }
  }
};

const identifierAddedHandler = async (
  event: IdentifierAddedEvent,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  dispatch(addOrUpdateProfileIdentity(event.payload.identifier));
};

const groupCreatedHandler = async (
  event: GroupCreatedEvent,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  await dispatch(addGroupProfileAsync(event.payload.group));
};

export {
  groupCreatedHandler,
  identifierAddedHandler,
  notificationStateChanged,
  operationCompleteHandler,
  operationFailureHandler,
};
