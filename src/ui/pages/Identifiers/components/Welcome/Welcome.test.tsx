const verifySecretMock = jest.fn();

import { IonInput, IonLabel } from "@ionic/react";
import { ionFireEvent } from "@ionic/react-test-utils";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { MiscRecordId } from "../../../../../core/agent/agent.types";
import ENG_TRANS from "../../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../../routes/paths";
import { setShowWelcomePage } from "../../../../../store/reducers/stateCache";
import { CustomInputProps } from "../../../../components/CustomInput/CustomInput.types";
import { Welcome } from "./Welcome";

jest.mock("../../../../../core/configuration", () => ({
  ...jest.requireActual("../../../../../core/configuration"),
  ConfigurationService: {
    env: {
      features: {
        cut: [],
      },
    },
  },
}));

jest.mock("signify-ts", () => ({
  ...jest.requireActual("signify-ts"),
  Salter: class Salter {
    public qb64 = "mock";
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

jest.mock("../../../../components/CustomInput", () => ({
  CustomInput: (props: CustomInputProps) => {
    return (
      <>
        <IonLabel
          position="stacked"
          data-testid={`${props.title?.toLowerCase().replace(" ", "-")}-title`}
        >
          {props.title}
          {props.optional && (
            <span className="custom-input-optional">(optional)</span>
          )}
        </IonLabel>
        <IonInput
          data-testid={props.dataTestId}
          onIonInput={(e) => {
            props.onChangeInput(e.detail.value as string);
          }}
        />
      </>
    );
  },
}));

const createIdentifierMock = jest.fn((args: unknown) =>
  Promise.resolve({
    identifier: "identifier-1",
    createdAt: new Date(),
  })
);
const markIdentifierPendingCreateMock = jest.fn((args: unknown) => ({}));
const deleteMock = jest.fn((arg: unknown) => Promise.resolve());
jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        deleteById: (args: unknown) => deleteMock(args),
      },
      identifiers: {
        getIdentifiersCache: jest.fn(),
        createIdentifier: (args: unknown) => createIdentifierMock(args),
        markIdentifierPendingCreate: (args: unknown) =>
          markIdentifierPendingCreateMock(args),
      },
    },
  },
}));

const initialState = {
  stateCache: {
    routes: [TabsRoutePath.IDENTIFIERS],
    currentAccount: "Account1",
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: true,
      userName: "Ann",
    },
  },
  viewTypeCache: {
    identifier: {
      viewType: null,
      favouriteIndex: 0,
    },
    credential: {
      viewType: null,
      favouriteIndex: 0,
    },
  },
  identifiersCache: {
    identifiers: {},
  },
  seedPhraseCache: {
    seedPhrase:
      "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
    brand: "brand",
  },
};

const mockStore = configureStore();
const dispatchMock = jest.fn();

const mockedStore = {
  ...mockStore(initialState),
  dispatch: dispatchMock,
};

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

describe("Welcome page", () => {
  test("Render", () => {
    const { getByText } = render(
      <Provider store={mockedStore}>
        <Welcome />
      </Provider>
    );

    expect(
      getByText(
        ENG_TRANS.tabs.identifiers.tab.welcome.welcometext.replace(
          "{{name}}",
          initialState.stateCache.currentAccount
        )
      )
    ).toBeVisible();
    expect(
      getByText(ENG_TRANS.tabs.identifiers.tab.welcome.skip)
    ).toBeVisible();
    expect(getByText(ENG_TRANS.tabs.identifiers.tab.welcome.add)).toBeVisible();
    expect(
      getByText(ENG_TRANS.tabs.identifiers.tab.welcome.text)
    ).toBeVisible();
  });

  test("Skip", () => {
    const { getByText } = render(
      <Provider store={mockedStore}>
        <Welcome />
      </Provider>
    );

    fireEvent.click(getByText(ENG_TRANS.tabs.identifiers.tab.welcome.skip));
    expect(deleteMock).toBeCalledWith(MiscRecordId.APP_FIRST_INSTALL);
    expect(dispatchMock).toBeCalledWith(setShowWelcomePage(false));
  });

  test("Create new identifier", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={mockedStore}>
        <Welcome />
      </Provider>
    );

    fireEvent.click(getByText(ENG_TRANS.tabs.identifiers.tab.welcome.add));

    expect(getByText(ENG_TRANS.createidentifier.add.title)).toBeVisible();

    const displayNameInput = getByTestId("display-name-input");

    fireEvent.click(getByTestId("color-1"));
    fireEvent.click(getByTestId("identifier-theme-selector-item-1"));
    ionFireEvent.ionInput(displayNameInput, "Test");

    await waitFor(() => {
      expect(getByTestId("color-1").classList.contains("selected"));
    });

    fireEvent.click(getByTestId("primary-button-create-identifier-modal"));

    await waitFor(() => {
      expect(createIdentifierMock).toBeCalledWith({
        displayName: "Test",
        theme: 11,
        groupMetadata: undefined,
      });
    });

    expect(deleteMock).toBeCalledWith(MiscRecordId.APP_FIRST_INSTALL);
    expect(dispatchMock).toBeCalledWith(setShowWelcomePage(false));
  });

  test("Create new group identifier", async () => {
    const openGroupIdentifier = jest.fn();
    const { getByText, getByTestId } = render(
      <Provider store={mockedStore}>
        <Welcome onCreateGroupIdentifier={openGroupIdentifier} />
      </Provider>
    );

    fireEvent.click(getByText(ENG_TRANS.tabs.identifiers.tab.welcome.add));

    expect(getByText(ENG_TRANS.createidentifier.add.title)).toBeVisible();

    const displayNameInput = getByTestId("display-name-input");

    fireEvent.click(getByTestId("identifier-aidtype-multisig"));
    fireEvent.click(getByTestId("color-1"));
    fireEvent.click(getByTestId("identifier-theme-selector-item-1"));
    ionFireEvent.ionInput(displayNameInput, "Test");

    await waitFor(() => {
      expect(getByTestId("color-1").classList.contains("selected"));
    });

    fireEvent.click(getByTestId("primary-button-create-identifier-modal"));

    await waitFor(() => {
      expect(createIdentifierMock).toBeCalledWith({
        displayName: "Test",
        theme: 11,
        groupMetadata: {
          groupCreated: false,
          groupId: "mock",
          groupInitiator: true,
        },
      });
    });

    expect(deleteMock).toBeCalledWith(MiscRecordId.APP_FIRST_INSTALL);
    expect(dispatchMock).toBeCalledWith(setShowWelcomePage(false));
    expect(openGroupIdentifier).toBeCalled();
  });
});
