import { SignifyClient } from "signify-ts";
import { NotificationStorage, OperationPendingStorage } from "../records";
import { NotificationRoute } from "./keriaNotificationService.types";
import { deleteNotificationRecordById } from "./utils";

// Mock console methods
const originalConsole = { ...console };
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe("Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    global.console = mockConsole as any;
  });

  afterEach(() => {
    // Restore console
    global.console = originalConsole;
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
      it("should delete notification without operation cleanup when operationPendingStorage is not provided", async () => {
        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route
        );

        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
        expect(mockOperationPendingStorage.findAllByQuery).not.toHaveBeenCalled();
      });

      it("should delete notification without operation cleanup when operationPendingStorage is provided but no linked requests", async () => {
        mockNotificationStorage.findById.mockResolvedValue({
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

      it("should delete notification when operationPendingStorage is provided but notification has no linkedRequest.current", async () => {
        mockNotificationStorage.findById.mockResolvedValue({
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
        mockNotificationStorage.findById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: linkedRequestCurrent },
        } as any);
      });

      it("should clean up pending operations when notification has linked requests", async () => {
        const mockOperations = [
          { id: "exchange.receivecredential.linked-request-456", recordType: "exchange.receivecredential" },
          { id: "exchange.offercredential.linked-request-456", recordType: "exchange.offercredential" },
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

      it("should filter out non-relevant operation types", async () => {
        const mockOperations = [
          { id: "witness.linked-request-456", recordType: "witness" },
          { id: "exchange.receivecredential.linked-request-456", recordType: "exchange.receivecredential" },
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

        // Should only delete the relevant operation
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledTimes(1);
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledWith("exchange.receivecredential.linked-request-456");

      });

      it("should handle empty operations array gracefully", async () => {
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

      it("should handle non-array operations result gracefully", async () => {
        mockOperationPendingStorage.findAllByQuery.mockResolvedValue(null as any);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockOperationPendingStorage.deleteById).not.toHaveBeenCalled();
        // Console logging has been removed from the implementation
        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });

      it("should handle operations with no relevant types", async () => {
        const mockOperations = [
          { id: "witness.linked-request-456", recordType: "witness" },
          { id: "group.linked-request-456", recordType: "group" },
        ];

        mockOperationPendingStorage.findAllByQuery.mockResolvedValue(mockOperations as any);

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
    });

    describe("Error handling in operation cleanup", () => {
      const linkedRequestCurrent = "linked-request-456";

      beforeEach(() => {
        mockNotificationStorage.findById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: linkedRequestCurrent },
        } as any);
      });

      it("should continue with notification deletion when operation cleanup fails", async () => {
        mockOperationPendingStorage.findAllByQuery.mockRejectedValue(new Error("Database error"));

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });

      it("should handle individual operation deletion failures gracefully", async () => {
        const mockOperations = [
          { id: "exchange.receivecredential.linked-request-456", recordType: "exchange.receivecredential" },
          { id: "exchange.offercredential.linked-request-456", recordType: "exchange.offercredential" },
        ];

        mockOperationPendingStorage.findAllByQuery.mockResolvedValue(mockOperations as any);
        mockOperationPendingStorage.deleteById
          .mockResolvedValueOnce(undefined) // First operation succeeds
          .mockRejectedValueOnce(new Error("Delete failed")); // Second operation fails

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });

      it("should handle invalid linked request current gracefully", async () => {
        mockNotificationStorage.findById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: null },
        } as any);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockOperationPendingStorage.findAllByQuery).not.toHaveBeenCalled();
        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });

      it("should handle empty string linked request current gracefully", async () => {
        mockNotificationStorage.findById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: "" },
        } as any);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockOperationPendingStorage.findAllByQuery).not.toHaveBeenCalled();
        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });
    });

    describe("Notification storage error handling", () => {
      it("should continue with deletion when notification findById fails", async () => {
        mockNotificationStorage.findById.mockRejectedValue(new Error("Storage error"));

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });
    });

    describe("KERIA notification marking", () => {
      it("should mark non-local notifications on KERIA", async () => {
        mockMarkFunction.mockResolvedValue(undefined);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          NotificationRoute.ExnIpexGrant
        );

        expect(mockMarkFunction).toHaveBeenCalledWith(notificationId);
      });

      it("should not mark local notifications on KERIA", async () => {
        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          NotificationRoute.LocalAcdcRevoked
        );

        expect(mockMarkFunction).not.toHaveBeenCalled();
      });

      it("should handle KERIA marking errors gracefully", async () => {
        mockMarkFunction.mockRejectedValue(new Error("KERIA error"));

        await expect(
          deleteNotificationRecordById(
            mockSignifyClient,
            mockNotificationStorage,
            notificationId,
            NotificationRoute.ExnIpexGrant
          )
        ).rejects.toThrow("KERIA error");
      });

      it("should ignore 404 errors from KERIA marking", async () => {
        mockMarkFunction.mockRejectedValue(new Error("Not Found - 404 - Resource not found"));

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          NotificationRoute.ExnIpexGrant
        );

        // Should not throw and should continue with deletion
        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });
    });

    describe("Edge cases", () => {
      it("should handle operations with mixed success/failure results", async () => {
        mockNotificationStorage.findById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: "linked-request-456" },
        } as any);

        const mockOperations = [
          { id: "exchange.receivecredential.linked-request-456", recordType: "exchange.receivecredential" },
          { id: "exchange.offercredential.linked-request-456", recordType: "exchange.offercredential" },
          { id: "exchange.presentcredential.linked-request-456", recordType: "exchange.presentcredential" },
        ];

        mockOperationPendingStorage.findAllByQuery.mockResolvedValue(mockOperations as any);
        mockOperationPendingStorage.deleteById
          .mockResolvedValueOnce(undefined) // First succeeds
          .mockRejectedValueOnce(new Error("Delete failed")) // Second fails
          .mockResolvedValueOnce(undefined); // Third succeeds

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

      });

      it("should handle operations with unexpected record types", async () => {
        mockNotificationStorage.findById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: "linked-request-456" },
        } as any);

        const mockOperations = [
          { id: "exchange.receivecredential.linked-request-456", recordType: "exchange.receivecredential" },
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

        // Should only delete the relevant operation
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledTimes(1);
        expect(mockOperationPendingStorage.deleteById).toHaveBeenCalledWith("exchange.receivecredential.linked-request-456");
      });

      it("should handle all three relevant operation types", async () => {
        mockNotificationStorage.findById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: "linked-request-456" },
        } as any);

        const mockOperations = [
          { id: "exchange.receivecredential.linked-request-456", recordType: "exchange.receivecredential" },
          { id: "exchange.offercredential.linked-request-456", recordType: "exchange.offercredential" },
          { id: "exchange.presentcredential.linked-request-456", recordType: "exchange.presentcredential" },
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

      it("should handle operations with duplicate record types", async () => {
        mockNotificationStorage.findById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: "linked-request-456" },
        } as any);

        const mockOperations = [
          { id: "exchange.receivecredential.linked-request-456", recordType: "exchange.receivecredential" },
          { id: "exchange.receivecredential.linked-request-456-2", recordType: "exchange.receivecredential" },
          { id: "exchange.offercredential.linked-request-456", recordType: "exchange.offercredential" },
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

      it("should handle operations with all non-relevant types", async () => {
        mockNotificationStorage.findById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: "linked-request-456" },
        } as any);

        const mockOperations = [
          { id: "witness.linked-request-456", recordType: "witness" },
          { id: "group.linked-request-456", recordType: "group" },
          { id: "oobi.linked-request-456", recordType: "oobi" },
        ];

        mockOperationPendingStorage.findAllByQuery.mockResolvedValue(mockOperations as any);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockOperationPendingStorage.deleteById).not.toHaveBeenCalled();
      });
    });

    describe("Input validation", () => {
      it("should handle null linked request current", async () => {
        mockNotificationStorage.findById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: null },
        } as any);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockOperationPendingStorage.findAllByQuery).not.toHaveBeenCalled();
        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });

      it("should handle undefined linked request current", async () => {
        mockNotificationStorage.findById.mockResolvedValue({
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

        expect(mockOperationPendingStorage.findAllByQuery).not.toHaveBeenCalled();
        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });

      it("should handle empty string linked request current", async () => {
        mockNotificationStorage.findById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: "" },
        } as any);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockOperationPendingStorage.findAllByQuery).not.toHaveBeenCalled();
        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });

      it("should handle non-string linked request current", async () => {
        mockNotificationStorage.findById.mockResolvedValue({
          id: notificationId,
          linkedRequest: { accepted: true, current: 123 as any },
        } as any);

        await deleteNotificationRecordById(
          mockSignifyClient,
          mockNotificationStorage,
          notificationId,
          route,
          mockOperationPendingStorage
        );

        expect(mockOperationPendingStorage.findAllByQuery).not.toHaveBeenCalled();
        expect(mockNotificationStorage.deleteById).toHaveBeenCalledWith(notificationId);
      });
    });
  });
});
