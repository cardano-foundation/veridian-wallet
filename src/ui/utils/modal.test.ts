import * as modalModule from "./modal";

jest.mock("./modal", () => ({
  ...jest.requireActual("./modal"),
  getPresentedOverlays: jest.fn(),
}));

const { dismissAllModals } = modalModule;

describe("dismissAllModals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should dismiss all modals and return true if no blocking modal is present", async () => {
    const mockModal1 = document.createElement("ion-modal") as any;
    mockModal1.overlayIndex = 1;
    mockModal1.dismiss = jest.fn();
    mockModal1.classList = {
      contains: jest.fn().mockReturnValue(false),
    };

    const mockModal2 = document.createElement("ion-modal") as any;
    mockModal2.overlayIndex = 2;
    mockModal2.dismiss = jest.fn();
    mockModal2.classList = {
      contains: jest.fn().mockReturnValue(false),
    };
    document.body.appendChild(mockModal1);
    document.body.appendChild(mockModal2);

    const result = await dismissAllModals();

    expect(result).toBe(true);
    expect(mockModal1.dismiss).toHaveBeenCalled();
    expect(mockModal2.dismiss).toHaveBeenCalled();

    document.body.removeChild(mockModal1);
    document.body.removeChild(mockModal2);
  });

  it("should dismiss and return false if blocking modal is present", async () => {
    const mockModal1 = document.createElement("ion-modal") as any;
    mockModal1.overlayIndex = 1;
    mockModal1.dismiss = jest.fn();
    mockModal1.classList = ["verify-seedphrase-alert"];

    const mockModal2 = document.createElement("ion-modal") as any;
    mockModal2.overlayIndex = 2;
    mockModal2.dismiss = jest.fn();
    mockModal2.classList = ["other-modal-class"];

    document.body.appendChild(mockModal1);
    document.body.appendChild(mockModal2);

    const result = await dismissAllModals();

    expect(result).toBe(false);
    expect(mockModal1.dismiss).not.toHaveBeenCalled();
    expect(mockModal2.dismiss).toHaveBeenCalled();

    document.body.removeChild(mockModal1);
    document.body.removeChild(mockModal2);
  });

  it("should handle no open modals gracefully", async () => {
    const result = await dismissAllModals();

    expect(result).toBe(true);
  });
});
