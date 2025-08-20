import { Operation, Salter, SignifyClient } from "signify-ts";
import { CredentialMetadataRecord, NotificationStorage } from "../records";
import { CredentialShortDetails } from "./credentialService.types";
import { Agent } from "../agent";
import { NotificationRoute } from "./keriaNotificationService.types";
import { OperationPendingStorage } from "../records/operationPendingStorage";

async function waitAndGetDoneOp(
  client: SignifyClient,
  op: Operation,
  timeout = 15000,
  interval = 250
): Promise<Operation> {
  const startTime = new Date().getTime();
  while (!op.done && new Date().getTime() < startTime + timeout) {
    op = await client.operations().get(op.name);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return op;
}

function getCredentialShortDetails(
  metadata: CredentialMetadataRecord
): CredentialShortDetails {
  return {
    id: metadata.id,
    issuanceDate: metadata.issuanceDate,
    credentialType: metadata.credentialType,
    status: metadata.status,
    schema: metadata.schema,
    identifierType: metadata.identifierType,
    identifierId: metadata.identifierId,
    connectionId: metadata.connectionId,
  };
}

const OnlineOnly = (
  _target: unknown,
  _propertyKey: string,
  descriptor: PropertyDescriptor
) => {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: unknown[]) {
    if (!Agent.agent.getKeriaOnlineStatus()) {
      throw new Error(Agent.KERIA_CONNECTION_BROKEN);
    }
    // Call the original method
    try {
      const executeResult = await originalMethod.apply(this, args);
      return executeResult;
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      if (isNetworkError(error)) {
        Agent.agent.markAgentStatus(false);
        Agent.agent.connect();
        throw new Error(Agent.KERIA_CONNECTION_BROKEN, {
          cause: error,
        });
      } else {
        throw error;
      }
    }
  };
};

export const deleteNotificationRecordById = async (
  client: SignifyClient,
  notificationStorage: NotificationStorage,
  id: string,
  route: NotificationRoute,
  operationPendingStorage?: OperationPendingStorage
): Promise<void> => {
  // Get the notification record before deleting to check for linked requests
  let notificationRecord = null;
  if (operationPendingStorage) {
    try {
      notificationRecord = await notificationStorage.findById(id);
    } catch (error) {
      // If we can't find the notification, proceed with deletion anyway
      // Silently continue with deletion
    }
  }

  if (!/^\/local/.test(route)) {
    await client
      .notifications()
      .mark(id)
      .catch((error) => {
        const status = error.message.split(" - ")[1];
        if (!/404/gi.test(status)) {
          throw error;
        }
      });
  }

  // Clean up any pending operations if this notification has linked requests
  if (operationPendingStorage && notificationRecord?.linkedRequest?.current) {
    await cleanupPendingOperations(operationPendingStorage, notificationRecord.linkedRequest.current, id);
  }

  await notificationStorage.deleteById(id);
};

/**
 * Clean up pending operations related to a notification's linked request
 * @param operationPendingStorage - Storage for pending operations
 * @param linkedRequestCurrent - The current linked request identifier
 * @param notificationId - The notification ID for logging purposes
 */
async function cleanupPendingOperations(
  operationPendingStorage: OperationPendingStorage,
  linkedRequestCurrent: string,
  _notificationId: string
): Promise<void> {
  try {
    // Validate the linked request identifier
    if (!linkedRequestCurrent || typeof linkedRequestCurrent !== 'string') {
      // Invalid identifier, skip cleanup
      return;
    }

    // Find pending operations related to this notification
    // Look for operations that end with the linked request identifier
    // This covers the pattern: {operationType}.{linkedRequestId}
    const pendingOperations = await operationPendingStorage.findAllByQuery({
      filter: {
        id: { $regex: `^.*\\.${linkedRequestCurrent}$` }
      }
    });

    // Early return if no operations found
    if (!Array.isArray(pendingOperations) || pendingOperations.length === 0) {
      return;
    }

    // Filter operations by type to ensure we only clean up relevant ones
    // These are the IPEX-related operation types that should be cleaned up
    const relevantOperationTypes = [
      'exchange.receivecredential',
      'exchange.offercredential', 
      'exchange.presentcredential'
    ];
    
    const filteredOperations = pendingOperations.filter(operation => 
      relevantOperationTypes.includes(operation.recordType)
    );

    if (filteredOperations.length === 0) {
      return;
    }

    // Group operations by type for potential future use
    // const operationsByType = filteredOperations.reduce((acc, operation) => {
    //   acc[operation.recordType] = (acc[operation.recordType] || 0) + 1;
    //   return acc;
    // }, {} as Record<string, number>);

    // Batch delete operations for better performance
    const deletePromises = filteredOperations.map(async (operation) => {
      try {
        await operationPendingStorage.deleteById(operation.id);
        return { success: true, id: operation.id, type: operation.recordType };
      } catch (error) {
        // Failed to delete operation, return failure status
        return { success: false, id: operation.id, type: operation.recordType, error };
      }
    });

    // Execute all delete operations and wait for completion
    await Promise.allSettled(deletePromises);
    
    // Results available for potential future use if needed

  } catch (error) {
    // Error occurred during cleanup, but don't fail the deletion
    // Error details are available in the error object for debugging if needed
  }
}

function randomSalt(): string {
  return new Salter({}).qb64;
}

function isNetworkError(error: Error): boolean {
  if (
    /Failed to fetch/gi.test(error.message) ||
    /network error/gi.test(error.message) ||
    /Load failed/gi.test(error.message) ||
    /NetworkError when attempting to fetch resource./gi.test(error.message) ||
    /The Internet connection appears to be offline./gi.test(error.message) ||
    /504/gi.test(error.message.split(" - ")[1]) // Gateway timeout
  ) {
    return true;
  }

  return false;
}

export {
  OnlineOnly,
  waitAndGetDoneOp,
  getCredentialShortDetails,
  randomSalt,
  isNetworkError,
};
