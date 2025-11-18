import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { RotateKeyModal } from "./RotateKeyModal";
import { ToastMsgType } from "../../../../globals/types";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";

const dispatchMock = jest.fn();
const ionRouterMock = { push: jest.fn() };
const rotateIdentifierMock = jest.fn((id: string) => Promise.resolve(id));
const setToastMsgMock = jest.fn((toastType: ToastMsgType) => ({
  type: "set-toast",
  payload: toastType,
}));

jest.mock("@ionic/react", () => {
  const actual = jest.requireActual("@ionic/react");
  return {
    ...actual,
    IonModal: ({ children, isOpen, ...props }: any) =>
      isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
  };
});

jest.mock("../../../../../store/hooks", () => ({
  useAppDispatch: () => dispatchMock,
  useAppSelector: () => ({}),
  useAppIonRouter: () => ionRouterMock,
}));

jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      identifiers: {
        rotateIdentifier: (id: string) => rotateIdentifierMock(id),
      },
    },
  },
}));

jest.mock("../../../../../store/reducers/stateCache", () => ({
  setToastMsg: (toastType: ToastMsgType) => setToastMsgMock(toastType),
}));

jest.mock("../../../../components/Verification", () => ({
  Verification: ({ verifyIsOpen, onVerify }: any) =>
    verifyIsOpen ? (
      <button
        data-testid="mock-verification-verify"
        onClick={() => onVerify && onVerify()}
      >
        Verify
      </button>
    ) : null,
}));

const defaultIdentifierId = "profile-123";

const renderModal = (
  props?: Partial<React.ComponentProps<typeof RotateKeyModal>>
) =>
  render(
    <RotateKeyModal
      isOpen={true}
      signingKey="test-signing-key"
      identifierId={defaultIdentifierId}
      onClose={jest.fn()}
      onReloadData={jest.fn()}
      {...props}
    />
  );

describe("RotateKeyModal", () => {
  beforeEach(() => {
    dispatchMock.mockClear();
    setToastMsgMock.mockClear();
    rotateIdentifierMock.mockReset();
    rotateIdentifierMock.mockResolvedValue(defaultIdentifierId);
  });

  it("renders the modal when open", () => {
    const { getByTestId, getByText } = renderModal();

    expect(getByTestId("rotate-keys")).toBeInTheDocument();
    expect(getByTestId("rotate-key-title")).toHaveTextContent(
      EN_TRANSLATIONS.tabs.home.tab.modals.rotatekeys.title
    );
    expect(
      getByText(EN_TRANSLATIONS.tabs.home.tab.modals.rotatekeys.done)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.home.tab.modals.rotatekeys.description)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.home.tab.modals.rotatekeys.message)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.home.tab.modals.rotatekeys.signingkey)
    ).toBeInTheDocument();
    expect(getByTestId("primary-button-rotate-key")).toHaveTextContent(
      EN_TRANSLATIONS.tabs.home.tab.modals.rotatekeys.confirm
    );
  });

  it("calls onClose when the header close button is clicked", () => {
    const onClose = jest.fn();
    const { getByTestId } = renderModal({ onClose });

    fireEvent.click(getByTestId("close-button"));

    expect(onClose).toHaveBeenCalled();
  });

  it("rotates the key and dispatches success toast after verification", async () => {
    const onReloadData = jest.fn();
    const { getByTestId } = renderModal({ onReloadData });

    fireEvent.click(getByTestId("primary-button-rotate-key"));

    await waitFor(() =>
      expect(getByTestId("mock-verification-verify")).toBeInTheDocument()
    );

    fireEvent.click(getByTestId("mock-verification-verify"));

    await waitFor(() => {
      expect(rotateIdentifierMock).toHaveBeenCalledWith(defaultIdentifierId);
      expect(onReloadData).toHaveBeenCalled();
      expect(setToastMsgMock).toHaveBeenCalledWith(
        ToastMsgType.ROTATE_KEY_SUCCESS
      );
      expect(dispatchMock).toHaveBeenCalledWith({
        type: "set-toast",
        payload: ToastMsgType.ROTATE_KEY_SUCCESS,
      });
    });
  });

  it("dispatches an error toast when rotation fails", async () => {
    rotateIdentifierMock.mockRejectedValueOnce(new Error("boom"));
    const { getByTestId } = renderModal();

    fireEvent.click(getByTestId("primary-button-rotate-key"));

    await waitFor(() =>
      expect(getByTestId("mock-verification-verify")).toBeInTheDocument()
    );

    fireEvent.click(getByTestId("mock-verification-verify"));

    await waitFor(() => {
      expect(setToastMsgMock).toHaveBeenCalledWith(
        ToastMsgType.ROTATE_KEY_ERROR
      );
      expect(dispatchMock).toHaveBeenCalledWith({
        type: "set-toast",
        payload: ToastMsgType.ROTATE_KEY_ERROR,
      });
    });
  });
});
