import { SignifyClient } from "signify-ts";
import { NotificationStorage, OperationPendingStorage, OperationPendingRecordType } from "../records";
import { NotificationRoute } from "./keriaNotificationService.types";
import { deleteNotificationRecordById } from "./utils";



describe("Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("deleteNotificationRecordById", () => {
    const mockMarkFunction = jest.fn();
    const mockSignifyClient = {
      notifications: () => ({
        mark: mockMarkFunction,
      }),
    } as unknown as SignifyClient;

    const mockNotificationStorage = jest.mocked({
      findById: jest.fn(),
      findExpectedById: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as NotificationStorage);

    const mockOperationPendingStorage = jest.mocked({
      findAllByQuery: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as OperationPendingStorage);

    const notificationId = "test-notification-123";
    const route = NotificationRoute.ExnIpexGrant;

    beforeEach(() => {
      jest.clearAllMocks();
      // Reset the mock mark function for each test
      mockMarkFunction.mockResolvedValue(undefined);
    });

    describe("Basic functionality", () => {
      test("should delete notification without operation cleanup when no linked requests exist", async () => {
        mockNotificationStorage.findExpectedById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: false },
        } as any);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
        expect(mockOperationPendingStorage.findAllByQuery).not.toHaveBeenCalled();
      });

      test("should delete notification without operation cleanup when operationPendingStorage is provided but no linked requests", async () => {
        mockNotificationStorage.findExpectedById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: false },
        } as any);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
        expect(mockOperationPendingStorage.findAllByQuery).not.toHaveBeenCalled();
      });

      test("should delete notification when operationPendingStorage is provided but notification has no linkedRequest.current", async () => {
        mockNotificationStorage.findExpectedById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: undefined },
        } as any);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
        expect(mockOperationPendingStorage.findAllByQuery).not.toHaveBeenCalled();
      });
    });

    describe("Operation cleanup functionality", () => {
      const linkedRequestCurrent = "linked-request-456";

      beforeEach(() => {
        mockNotificationStorage.findExpectedById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: linkedRequestCurrent },
        } as any);
      });

      test("should clean up pending operations when notification has linked requests", async () => {
        const mockOperations = [
          { id: "exchange.receivecredential.linked-request-456", recordType: OperationPendingRecordType.ExchangeReceiveCredential },
          { id: "exchange.offercredential.linked-request-456", recordType: OperationPendingRecordType.ExchangeOfferCredential },
        ];

        mockOperationPendingStorage.findAllByQuery.mockResolvedValue(mockOperations as any);
        mockOperationPendingStorage.deleteById.mockResolvedValue(undefined);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockOperationPendingStorage.findAllByQuery).toHaveBeenCalledWith({
          filter: {
            id: { $regex: `^.*\\.${linkedRequestCurrent}$` }
          }
        });

        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledTimes(2);
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledWith("exchange.receivecredential.linked-request-456");
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledWith("exchange.offercredential.linked-request-456");

        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });

      test("should delete all found operations regardless of type", async () => {
        const mockOperations = [
          { id: "witness.linked-request-456", recordType: OperationPendingRecordType.Witness },
          { id: "exchange.receivecredential.linked-request-456", recordType: OperationPendingRecordType.ExchangeReceiveCredential },
          { id: "group.linked-request-456", recordType: OperationPendingRecordType.Group },
        ];

        mockOperationPendingStorage.findAllByQuery.mockResolvedValue(mockOperations as any);
        mockOperationPendingStorage.deleteById.mockResolvedValue(undefined);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        // Should delete all operations found
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledTimes(3);
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledWith("witness.linked-request-456");
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledWith("exchange.receivecredential.linked-request-456");
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledWith("group.linked-request-456");

        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });

      test("should handle empty operations array gracefully", async () => {
        mockOperationPendingStorage.findAllByQuery.mockResolvedValue([]);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockOperationPendingStorage.deleteById).not.toHaveBeenCalled();
        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });

      test("should handle non-array operations result gracefully", async () => {
        mockOperationPendingStorage.findAllByQuery.mockResolvedValue(null as any);

        await expect(deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        )).rejects.toThrow("Cannot read properties of null (reading 'length')");

        expect(mockOperationPendingStorage.findAllByQuery).toHaveBeenCalled();
        expect(mockOperationPendingStorage.deleteById).not.toHaveBeenCalled();
        expect(mockNotificationStorage.deleteById).not.toHaveBeenCalled();
      });

      test("should delete operations with any record type", async () => {
        const mockOperations = [
          { id: "witness.linked-request-456", recordType: "witness" },
          { id: "group.linked-request-456", recordType: "group" },
        ];

        mockOperationPendingStorage.findAllByQuery.mockResolvedValue(mockOperations as any);
        mockOperationPendingStorage.deleteById.mockResolvedValue(undefined);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledTimes(2);
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledWith("witness.linked-request-456");
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledWith("group.linked-request-456");
        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });

      test("should continue processing other operations when one deletion fails", async () => {
        const mockOperations = [
          { id: "exchange.receivecredential.linked-request-456", recordType: OperationPendingRecordType.ExchangeReceiveCredential },
          { id: "exchange.offercredential.linked-request-456", recordType: OperationPendingRecordType.ExchangeOfferCredential },
          { id: "exchange.presentcredential.linked-request-456", recordType: OperationPendingRecordType.ExchangePresentCredential },
        ];

        mockOperationPendingStorage.findAllByQuery.mockResolvedValue(mockOperations as any);
        mockOperationPendingStorage.deleteById
          .mockRejectedValueOnce(new Error("First deletion failed")) // First operation fails
          .mockResolvedValueOnce(undefined) // Second operation succeeds
          .mockResolvedValueOnce(undefined); // Third operation succeeds

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        // Should attempt to delete all three operations despite the first failure
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledTimes(3);
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledWith("exchange.receivecredential.linked-request-456");
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledWith("exchange.offercredential.linked-request-456");
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledWith("exchange.presentcredential.linked-request-456");
        
        // Notification should still be deleted even if some operations fail
        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });
    });

    describe("Notification storage error handling", () => {
      test("should throw error when notification findExpectedById fails", async () => {
        mockNotificationStorage.findExpectedById.mockRejectedValue(new Error("Storage error"));

        await expect(
          deleteNotificationRecordById(
            mockSignifyClient,
            mockNotificationStorage,
            notificationId,
            route,
            mockOperationPendingStorage
          )
        ).rejects.toThrow("Storage error");
      });
    });

    describe("KERIA notification marking", () => {
      test("should mark non-local notifications on KERIA", async () => {
        mockMarkFunction.mockResolvedValue(undefined);
        mockNotificationStorage.findExpectedById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: false },
        } as any);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          NotificationRoute.ExnIpexGrant,
          mockOperationPendingStorage
        );

        expect(mockMarkFunction).toHaveBeenCalledWith(notificationId);
      });

      test("should not mark local notifications on KERIA", async () => {
        mockNotificationStorage.findExpectedById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: false },
        } as any);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          NotificationRoute.LocalAcdcRevoked,
          mockOperationPendingStorage
        );

        expect(mockMarkFunction).not.toHaveBeenCalled();
      });

      test("should handle KERIA marking errors gracefully", async () => {
        mockMarkFunction.mockRejectedValue(new Error("KERIA error"));
        mockNotificationStorage.findExpectedById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: false },
        } as any);

        await expect(
          deleteNotificationRecordById(
            mockSignifyClient,
            mockNotificationStorage,
            notificationId,
            NotificationRoute.ExnIpexGrant,
            mockOperationPendingStorage
          )
        ).rejects.toThrow("KERIA error");
      });

      test("should ignore 404 errors from KERIA marking", async () => {
        mockMarkFunction.mockRejectedValue(new Error("Not Found - 404 - Resource not found"));
        mockNotificationStorage.findExpectedById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: false },
        } as any);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          NotificationRoute.ExnIpexGrant,
          mockOperationPendingStorage
        );

        // Should not throw and should continue with deletion
        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });
    });

    describe("Edge cases", () => {
      test("should handle operations with unexpected record types", async () => {
        mockNotificationStorage.findExpectedById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: "linked-request-456" },
        } as any);

        const mockOperations = [
          { id: "exchange.receivecredential.linked-request-456", recordType: OperationPendingRecordType.ExchangeReceiveCredential },
          { id: "unknown.linked-request-456", recordType: "unknown" },
        ];

        mockOperationPendingStorage.findAllByQuery.mockResolvedValue(mockOperations as any);
        mockOperationPendingStorage.deleteById.mockResolvedValue(undefined);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        // Should delete all operations found
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledTimes(2);
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledWith("exchange.receivecredential.linked-request-456");
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledWith("unknown.linked-request-456");
      });

      test("should delete all operations regardless of type", async () => {
        mockNotificationStorage.findExpectedById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: "linked-request-456" },
        } as any);

        const mockOperations = [
          { id: "exchange.receivecredential.linked-request-456", recordType: OperationPendingRecordType.ExchangeReceiveCredential },
          { id: "exchange.offercredential.linked-request-456", recordType: OperationPendingRecordType.ExchangeOfferCredential },
          { id: "exchange.presentcredential.linked-request-456", recordType: OperationPendingRecordType.ExchangePresentCredential },
        ];

        mockOperationPendingStorage.findAllByQuery.mockResolvedValue(mockOperations as any);
        mockOperationPendingStorage.deleteById.mockResolvedValue(undefined);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledTimes(3);
      });
    });
  });
});
