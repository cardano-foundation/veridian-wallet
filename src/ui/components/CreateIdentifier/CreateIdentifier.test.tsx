import { Capacitor } from "@capacitor/core";
import { IonInput, IonLabel, setupIonicReact } from "@ionic/react";
import { ready } from "signify-ts";
import { ionFireEvent, mockIonicReact } from "@ionic/react-test-utils";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import {
  ConnectionDetails,
  CreationStatus,
} from "../../../core/agent/agent.types";
import { IdentifierService } from "../../../core/agent/services";
import EN_TRANSLATION from "../../../locales/en/en.json";
import { setMultiSigGroupCache } from "../../../store/reducers/identifiersCache";
import { showNoWitnessAlert } from "../../../store/reducers/stateCache";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import { filteredIdentifierMapFix } from "../../__fixtures__/filteredIdentifierFix";
import { CustomInputProps } from "../CustomInput/CustomInput.types";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { CreateIdentifier } from "./CreateIdentifier";
import { makeTestStore } from "../../utils/makeTestStore";

setupIonicReact();
mockIonicReact();

jest.mock("../../../core/configuration", () => ({
  ...jest.requireActual("../../../core/configuration"),
  ConfigurationService: {
    env: {
      features: {
        cut: [],
      },
    },
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen }: any) => (
    <div style={{ display: isOpen ? "block" : "none" }}>{children}</div>
  ),
}));

const mockGetMultisigConnection = jest.fn((args: any) =>
  Promise.resolve([] as ConnectionDetails[])
);
const createIdentifierMock = jest.fn();
const markIdentifierPendingCreateMock = jest.fn((args: unknown) => ({}));

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      connections: {
        getMultisigLinkedContacts: (args: any) =>
          mockGetMultisigConnection(args),
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

const addKeyboardEventMock = jest.fn();

jest.mock("@capacitor/keyboard", () => ({
  Keyboard: {
    addListener: (...params: any[]) => addKeyboardEventMock(...params),
  },
}));

jest.mock("@capacitor/core", () => {
  return {
    ...jest.requireActual("@capacitor/core"),
    Capacitor: {
      isNativePlatform: () => true,
    },
  };
});

jest.mock("../CustomInput", () => ({
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

describe("Create Identifier modal", () => {
  beforeAll(async () => {
    await ready();
  });

  beforeEach(() => {
    mockGetMultisigConnection.mockImplementation((): any =>
      Promise.resolve([] as ConnectionDetails[])
    );
    createIdentifierMock.mockImplementation((args: unknown) => ({
      identifier: "mock-id",
      creationStatus: CreationStatus.PENDING,
    }));
  });

  const initialState = {
    stateCache: {
      routes: [TabsRoutePath.CREDENTIALS],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
        passwordIsSet: false,
      },
      queueIncomingRequest: {
        isProcessing: false,
        queues: [],
        isPaused: false,
      },
      isOnline: true,
    },
    identifiersCache: {
      identifiers: {},
    },
  };

  const dispatchMock = jest.fn();
  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  test("It can dismiss the modal", async () => {
    const setModalIsOpen = jest.fn();
    const { getByText } = render(
      <Provider store={storeMocked}>
        <CreateIdentifier
          modalIsOpen={true}
          setModalIsOpen={setModalIsOpen}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATION.createidentifier.cancel));
    });

    await waitFor(() => {
      expect(setModalIsOpen).toBeCalledWith(false);
    });
  });

  test("Update multisig group", async () => {
    render(
      <Provider store={storeMocked}>
        <CreateIdentifier
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
          groupId="mockId"
        />
      </Provider>
    );

    await waitFor(() => {
      expect(mockGetMultisigConnection).toBeCalledWith("mockId");
      expect(dispatchMock).toBeCalledWith(
        setMultiSigGroupCache({
          groupId: "mockId",
          connections: [],
        })
      );
    });
  });

  test("It shows the spinner and closes the modal when creating a new Default identifier", async () => {
    const setModalIsOpen = jest.fn();
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <CreateIdentifier
          modalIsOpen={true}
          setModalIsOpen={setModalIsOpen}
        />
      </Provider>
    );
    const displayNameInput = getByTestId("display-name-input");
    act(() => {
      ionFireEvent.ionInput(displayNameInput, "Test");
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-create-identifier-modal"));
    });

    await waitFor(() => {
      expect(getByTestId("spinner-container")).toBeVisible();
    });

    await waitFor(() => {
      expect(setModalIsOpen).toBeCalledWith(false);
    });
  });

  test("renders default content", async () => {
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <CreateIdentifier
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
        />
      </Provider>
    );
    expect(
      getByText(EN_TRANSLATION.createidentifier.add.title)
    ).toBeInTheDocument();
    expect(getByTestId("display-name-title")).toBeInTheDocument();
    expect(getByTestId("display-name-input")).toBeInTheDocument();
    expect(getByTestId("aid-type-selector")).toBeInTheDocument();
    expect(getByTestId("identifier-theme-selector")).toBeInTheDocument();
    expect(
      getByTestId("primary-button-create-identifier-modal")
    ).toBeInTheDocument();
  });

  test("Keyboard event register", () => {
    render(
      <Provider store={storeMocked}>
        <CreateIdentifier
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
        />
      </Provider>
    );

    Capacitor.isNativePlatform = jest.fn().mockImplementation(() => true);

    expect(addKeyboardEventMock).toBeCalledTimes(2);
  });

  test("Multisig create new identifier: mutilsign", async () => {
    const groupMockId = "b75838e5-98cb-46cf-9233-8bf3beca4cd3";
    mockGetMultisigConnection.mockImplementation(() =>
      Promise.resolve([connectionsFix[3]])
    );

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <CreateIdentifier
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
          groupId={groupMockId}
        />
      </Provider>
    );

    const displayNameInput = getByTestId("display-name-input");
    act(() => {
      fireEvent.click(getByTestId("identifier-aidtype-multisig"));
      ionFireEvent.ionInput(displayNameInput, "Test");
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-create-identifier-modal"));
    });

    await waitFor(() => {
      expect(mockGetMultisigConnection).toBeCalledTimes(1);
      expect(mockGetMultisigConnection).toBeCalledWith(groupMockId);
      expect(dispatchMock).toBeCalledWith(
        setMultiSigGroupCache({
          groupId: groupMockId,
          connections: [connectionsFix[3]],
        })
      );
    });
  });

  test("Create new identifier with selected color and theme", async () => {
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <CreateIdentifier
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
        />
      </Provider>
    );

    const displayNameInput = getByTestId("display-name-input");

    act(() => {
      fireEvent.click(getByTestId("color-1"));
      fireEvent.click(getByTestId("identifier-theme-selector-item-1"));
      ionFireEvent.ionInput(displayNameInput, "Test");
    });

    await waitFor(() => {
      expect(getByTestId("color-1").classList.contains("selected"));
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-create-identifier-modal"));
    });

    await waitFor(() => {
      expect(createIdentifierMock).toBeCalledWith({
        displayName: "Test",
        theme: 11,
        groupMetadata: undefined,
      });
    });
  });

  test("Display error when display name invalid", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
        queueIncomingRequest: {
          isProcessing: false,
          queues: [],
          isPaused: false,
        },
        isOnline: true,
      },
      identifiersCache: {
        identifiers: filteredIdentifierMapFix,
      },
    };

    const dispatchMock = jest.fn();
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <CreateIdentifier
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
        />
      </Provider>
    );

    act(() => {
      ionFireEvent.ionInput(getByTestId("display-name-input"), "");
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATION.nameerror.onlyspace)).toBeVisible();
    });

    act(() => {
      ionFireEvent.ionInput(getByTestId("display-name-input"), "   ");
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATION.nameerror.onlyspace)).toBeVisible();
    });

    act(() => {
      ionFireEvent.ionInput(
        getByTestId("display-name-input"),
        "Duke Duke Duke Duke  Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke"
      );
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATION.nameerror.maxlength)).toBeVisible();
    });

    act(() => {
      ionFireEvent.ionInput(getByTestId("display-name-input"), "Duke@@");
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATION.nameerror.hasspecialchar)).toBeVisible();
    });

    act(() => {
      ionFireEvent.ionInput(
        getByTestId("display-name-input"),
        "Professional ID"
      );
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-create-identifier-modal"));
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATION.nameerror.duplicatename)).toBeVisible();
    });
  });

  test("Show AID type infomation modal", async () => {
    const { getByTestId, getByText, queryByText } = render(
      <Provider store={storeMocked}>
        <CreateIdentifier
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("type-input-title"));
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATION.createidentifier.aidinfo.title)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATION.createidentifier.aidinfo.delegated.text)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATION.createidentifier.aidinfo.individual.text)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATION.createidentifier.aidinfo.group.text)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByText(EN_TRANSLATION.createidentifier.aidinfo.button.done)
      );
    });

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATION.createidentifier.aidinfo.title)
      ).not.toBeVisible();
      expect(
        queryByText(EN_TRANSLATION.createidentifier.aidinfo.delegated.text)
      ).not.toBeVisible();
      expect(
        queryByText(EN_TRANSLATION.createidentifier.aidinfo.individual.text)
      ).not.toBeVisible();
      expect(
        queryByText(EN_TRANSLATION.createidentifier.aidinfo.group.text)
      ).not.toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("identifier-delegated-container"));
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATION.createidentifier.aidinfo.title)
      ).toBeVisible();
    });
  });

  test("No witness availability", async () => {
    createIdentifierMock.mockImplementation(() =>
      Promise.reject(
        new Error(IdentifierService.INSUFFICIENT_WITNESSES_AVAILABLE)
      )
    );

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <CreateIdentifier
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
        />
      </Provider>
    );

    const displayNameInput = getByTestId("display-name-input");

    act(() => {
      fireEvent.click(getByTestId("color-1"));
      fireEvent.click(getByTestId("identifier-theme-selector-item-1"));
      ionFireEvent.ionInput(displayNameInput, "Test");
    });

    await waitFor(() => {
      expect(getByTestId("color-1").classList.contains("selected"));
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-create-identifier-modal"));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(showNoWitnessAlert(true));
    });
  });

  test("Misconfigured agent", async () => {
    createIdentifierMock.mockImplementation(() =>
      Promise.reject(
        new Error(IdentifierService.MISCONFIGURED_AGENT_CONFIGURATION)
      )
    );

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <CreateIdentifier
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
        />
      </Provider>
    );

    const displayNameInput = getByTestId("display-name-input");

    act(() => {
      fireEvent.click(getByTestId("color-1"));
      fireEvent.click(getByTestId("identifier-theme-selector-item-1"));
      ionFireEvent.ionInput(displayNameInput, "Test");
    });

    await waitFor(() => {
      expect(getByTestId("color-1").classList.contains("selected"));
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-create-identifier-modal"));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(showNoWitnessAlert(true));
    });
  });
});
