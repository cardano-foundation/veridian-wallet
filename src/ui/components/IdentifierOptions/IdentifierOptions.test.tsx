import { waitForIonicReact } from "@ionic/react-test-utils";
import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { filteredIdentifierMapFix } from "../../__fixtures__/filteredIdentifierFix";
import { identifierFix } from "../../__fixtures__/identifierFix";
import { makeTestStore } from "../../utils/makeTestStore";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { IdentifierOptions } from "./IdentifierOptions";

const updateMock = jest.fn();
const oobi =
  "http://keria:3902/oobi/EIEm2e5njbFZMUBPOtfRKdOUJ2EEN2e6NDnAMgBfdc3x/agent/ENjGAcU_Zq95OP_BIyTLgTahVd4xh-cVkecse6kaJqYv?name=Frank";

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      identifiers: {
        updateIdentifier: () => updateMock(() => Promise.resolve(true)),
      },
    },
  },
}));

jest.mock("react-qrcode-logo", () => {
  return {
    ...jest.requireActual("react-qrcode-logo"),
    QRCode: () => <div></div>,
  };
});

describe("Identifier Options modal", () => {
  const dispatchMock = jest.fn();
  let mockedStore: Store<unknown, AnyAction>;
  beforeEach(() => {
    jest.resetAllMocks();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: true,
        },
      },
      identifiersCache: {
        identifiers: filteredIdentifierMapFix,
      },
    };
    mockedStore = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };
  });

  test("should display the elements inside the modal", async () => {
    const setIdentifierOptionsIsOpen = jest.fn();
    const setCardData = jest.fn();
    const { getByTestId } = render(
      <Provider store={mockedStore}>
        <IdentifierOptions
          handleRotateKey={jest.fn()}
          optionsIsOpen={true}
          setOptionsIsOpen={setIdentifierOptionsIsOpen}
          cardData={identifierFix[0]}
          oobi={oobi}
          setCardData={setCardData}
          handleDeleteIdentifier={async () => {
            jest.fn();
          }}
        />
      </Provider>
    );
    await waitForIonicReact();

    expect(getByTestId("edit-identifier-option")).toBeVisible();
    expect(getByTestId("rotate-keys-option")).toBeVisible();
    expect(getByTestId("share-identifier-option")).toBeVisible();
    expect(getByTestId("delete-identifier-option")).toBeVisible();
  });

  test("should not display the rotate-keys-option inside the modal", async () => {
    const setIdentifierOptionsIsOpen = jest.fn();
    const setCardData = jest.fn();
    const { queryByTestId } = render(
      <Provider store={mockedStore}>
        <IdentifierOptions
          handleRotateKey={jest.fn()}
          optionsIsOpen={true}
          setOptionsIsOpen={setIdentifierOptionsIsOpen}
          cardData={identifierFix[2]}
          oobi={oobi}
          setCardData={setCardData}
          handleDeleteIdentifier={async () => {
            jest.fn();
          }}
        />
      </Provider>
    );
    await waitForIonicReact();

    await waitFor(() =>
      expect(queryByTestId("edit-identifier-option")).toBeInTheDocument()
    );
    expect(queryByTestId("rotate-keys-option")).not.toBeInTheDocument();
  });

  test("can exclude restricted options in certain flows", async () => {
    const { queryByTestId } = render(
      <Provider store={mockedStore}>
        <IdentifierOptions
          handleRotateKey={jest.fn()}
          optionsIsOpen={true}
          setOptionsIsOpen={jest.fn()}
          cardData={identifierFix[2]}
          oobi={oobi}
          setCardData={jest.fn()}
          handleDeleteIdentifier={async () => {
            jest.fn();
          }}
          restrictedOptions={true}
        />
      </Provider>
    );
    await waitForIonicReact();

    await waitFor(() =>
      expect(queryByTestId("edit-identifier-option")).toBeInTheDocument()
    );
    expect(queryByTestId("delete-identifier-option")).not.toBeInTheDocument();
  });
});

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children }: { children: any }) => children,
}));

describe("Identifier Options function test", () => {
  const dispatchMock = jest.fn();
  let mockedStore: Store<unknown, AnyAction>;
  beforeAll(() => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: true,
        },
      },
      identifiersCache: {
        identifiers: filteredIdentifierMapFix,
      },
    };
    mockedStore = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };
  });

  test("Open edit modal view", async () => {
    const setIdentifierOptionsIsOpen = jest.fn();
    const setCardData = jest.fn();
    const { getByTestId, getAllByText } = render(
      <Provider store={mockedStore}>
        <IdentifierOptions
          handleRotateKey={jest.fn()}
          optionsIsOpen={true}
          setOptionsIsOpen={setIdentifierOptionsIsOpen}
          cardData={identifierFix[0]}
          oobi={oobi}
          setCardData={setCardData}
          handleDeleteIdentifier={async () => {
            jest.fn();
          }}
        />
      </Provider>
    );
    await waitForIonicReact();

    expect(getByTestId("edit-identifier-option")).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("edit-identifier-option"));
    });

    await waitFor(() => {
      expect(setIdentifierOptionsIsOpen).toBeCalledTimes(1);
    });

    expect(
      getAllByText(EN_TRANSLATIONS.tabs.identifiers.details.options.edit)[0]
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("identifier-theme-selector-item-1"));
    });

    await waitFor(() => {
      expect(
        getByTestId("primary-button-edit-identifier").getAttribute("disabled")
      ).toBe("false");
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-edit-identifier"));
    });

    await waitFor(() => {
      expect(updateMock).toBeCalledTimes(1);
    });
  });

  test("Delete identifier", async () => {
    const setIdentifierOptionsIsOpen = jest.fn();
    const setCardData = jest.fn();
    const mockDelete = jest.fn();
    const { getByTestId } = render(
      <Provider store={mockedStore}>
        <IdentifierOptions
          handleRotateKey={jest.fn()}
          optionsIsOpen={true}
          setOptionsIsOpen={setIdentifierOptionsIsOpen}
          cardData={identifierFix[0]}
          oobi={oobi}
          setCardData={setCardData}
          handleDeleteIdentifier={mockDelete}
        />
      </Provider>
    );
    await waitForIonicReact();

    expect(getByTestId("delete-identifier-option")).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("delete-identifier-option"));
    });

    await waitFor(() => {
      expect(mockDelete).toBeCalledTimes(1);
    });
  });
});
