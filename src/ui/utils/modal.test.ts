import { modalController } from "@ionic/core";
import { dismissAllModals } from "./modal";

jest.mock("@ionic/core", () => ({
  modalController: {
    getTop: jest.fn(),
  },
}));

describe("dismissAllModals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should dismiss all modals if no blocking modal is present", async () => {
    const mockModal1 = {
      dismiss: jest.fn(),
      classList: { contains: jest.fn().mockReturnValue(false) },
    };
    const mockModal2 = {
      dismiss: jest.fn(),
      classList: { contains: jest.fn().mockReturnValue(false) },
    };

    // Chain mocks: modal1 -> modal2 -> undefined
    (modalController.getTop as jest.Mock)
      .mockResolvedValueOnce(mockModal1)
      .mockResolvedValueOnce(mockModal2)
      .mockResolvedValueOnce(undefined);

    const result = await dismissAllModals();

    expect(result).toBe(true);
    expect(mockModal1.classList.contains).toHaveBeenCalledWith(
      "verify-seedphrase-alert"
    );
    expect(mockModal1.dismiss).toHaveBeenCalled();
    expect(mockModal2.classList.contains).toHaveBeenCalledWith(
      "verify-seedphrase-alert"
    );
    expect(mockModal2.dismiss).toHaveBeenCalled();
    expect(modalController.getTop).toHaveBeenCalledTimes(3);
  });

  it("should dismiss multiple non-blocking modals on top of a blocking modal, then stop", async () => {
    // Stack: Modal 1 (Top) -> Modal 2 -> Blocking Modal (Bottom)
    const mockModal1 = {
      dismiss: jest.fn(),
      classList: { contains: jest.fn().mockReturnValue(false) },
    };
    const mockModal2 = {
      dismiss: jest.fn(),
      classList: { contains: jest.fn().mockReturnValue(false) },
    };
    const mockBlockingModal = {
      dismiss: jest.fn(),
      classList: {
        contains: jest
          .fn()
          .mockImplementation((cls) => cls === "verify-seedphrase-alert"),
      },
    };

    // Chain mocks: modal1 -> modal2 -> blockingModal
    (modalController.getTop as jest.Mock)
      .mockResolvedValueOnce(mockModal1)
      .mockResolvedValueOnce(mockModal2)
      .mockResolvedValueOnce(mockBlockingModal);

    const result = await dismissAllModals();

    expect(result).toBe(false);
    expect(mockModal1.dismiss).toHaveBeenCalled();
    expect(mockModal2.dismiss).toHaveBeenCalled();
    expect(mockBlockingModal.dismiss).not.toHaveBeenCalled();
    // 3 calls: check modal1, check modal2, check blockingModal (and stop)
    expect(modalController.getTop).toHaveBeenCalledTimes(3);
  });

  it("should stop dismissal and return false if a blocking modal is encountered (single layer)", async () => {
    const mockModal1 = {
      dismiss: jest.fn(),
      classList: { contains: jest.fn().mockReturnValue(false) },
    };
    const mockBlockingModal = {
      dismiss: jest.fn(),
      classList: {
        contains: jest
          .fn()
          .mockImplementation((cls) => cls === "verify-seedphrase-alert"),
      },
    };

    // Chain mocks: modal1 -> blockingModal
    (modalController.getTop as jest.Mock)
      .mockResolvedValueOnce(mockModal1)
      .mockResolvedValueOnce(mockBlockingModal);

    const result = await dismissAllModals();

    expect(result).toBe(false);
    expect(mockModal1.dismiss).toHaveBeenCalled(); // Should have dismissed the first one
    expect(mockBlockingModal.dismiss).not.toHaveBeenCalled(); // Should NOT dismiss the blocking one
    expect(modalController.getTop).toHaveBeenCalledTimes(2);
  });

  it("should dismiss 'verify-seedphrase' modal but stop at 'verify-seedphrase-alert'", async () => {
    // Stack: VerifySeedPhrase (Top) -> VerifySeedPhraseAlert (Bottom)
    const mockVerificationModal = {
      dismiss: jest.fn(),
      classList: {
        contains: jest
          .fn()
          .mockImplementation((cls) => cls === "verify-seedphrase"),
      },
    };
    const mockAlertModal = {
      dismiss: jest.fn(),
      classList: {
        contains: jest
          .fn()
          .mockImplementation((cls) => cls === "verify-seedphrase-alert"),
      },
    };

    (modalController.getTop as jest.Mock)
      .mockResolvedValueOnce(mockVerificationModal)
      .mockResolvedValueOnce(mockAlertModal);

    const result = await dismissAllModals();

    expect(result).toBe(false);
    expect(mockVerificationModal.dismiss).toHaveBeenCalled(); // Should be dismissed now
    expect(mockAlertModal.dismiss).not.toHaveBeenCalled(); // Should blocked
    expect(modalController.getTop).toHaveBeenCalledTimes(2);
  });

  it("should stop dismissal if 'verify-seedphrase-alert' modal is encountered", async () => {
    const mockBlockingModal = {
      dismiss: jest.fn(),
      classList: {
        contains: jest
          .fn()
          .mockImplementation((cls) => cls === "verify-seedphrase-alert"),
      },
    };

    (modalController.getTop as jest.Mock).mockResolvedValueOnce(
      mockBlockingModal
    );

    const result = await dismissAllModals();

    expect(result).toBe(false);
    expect(mockBlockingModal.dismiss).not.toHaveBeenCalled();
  });

  it("should handle no open modals gracefully", async () => {
    (modalController.getTop as jest.Mock).mockResolvedValue(undefined);

    const result = await dismissAllModals();

    expect(result).toBe(true);
    expect(modalController.getTop).toHaveBeenCalledTimes(1);
  });
});
