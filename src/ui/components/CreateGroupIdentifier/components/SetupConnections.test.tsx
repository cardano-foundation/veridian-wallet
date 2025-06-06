import { setupIonicReact } from "@ionic/react";
import { act } from "react";
import { mockIonicReact } from "@ionic/react-test-utils";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import EN_TRANSLATIONS from "../../../../locales/en/en.json";
import { store } from "../../../../store";
import {
  setCurrentOperation,
  setToastMsg,
} from "../../../../store/reducers/stateCache";
import { connectionsFix } from "../../../__fixtures__/connectionsFix";
import { OperationType, ToastMsgType } from "../../../globals/types";
import { IdentifierColor } from "../../CreateIdentifier/components/IdentifierColorSelector";
import { TabsRoutePath } from "../../navigation/TabsMenu";
import { Stage } from "../CreateGroupIdentifier.types";
import { SetupConnections } from "./SetupConnections";
import { passcodeFiller } from "../../../utils/passcodeFiller";
import { CreationStatus } from "../../../../core/agent/agent.types";
import { transformGroupIdentifier } from "../../../../utils/transformGroupIdentifier";
import { identifierFix } from "../../../__fixtures__/identifierFix";

setupIonicReact();
mockIonicReact();

const getOobiMock = jest.fn((...args: any) =>
  Promise.resolve(
    "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org:3902"
  )
);

const deleteIdentifier = jest.fn();
const markIdentifierPendingDelete = jest.fn();

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

jest.mock("../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      connections: {
        getOobi: (...args: any) => getOobiMock(...args),
      },
      identifiers: {
        deleteIdentifier: () => deleteIdentifier(),
        markIdentifierPendingDelete: () => markIdentifierPendingDelete(),
      },
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
    },
  },
}));

const historyPushMock = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    push: (args: any) => {
      historyPushMock(args);
    },
  }),
}));

describe("Create group identifier - Setup Connection", () => {
  const mockStore = configureStore();

  const initialState = {
    stateCache: {
      routes: [TabsRoutePath.IDENTIFIERS],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
        passwordIsSet: false,
        userName: "Duke",
      },
      isOnline: true,
      queueIncomingRequest: {
        isProcessing: false,
        queues: [],
        isPaused: false,
      },
    },
    identifiersCache: {
      identifiers: {},
      favourites: [],
      multiSigGroup: {
        groupId: "b75838e5-98cb-46cf-9233-8bf3beca4cd3",
        connections: [connectionsFix[3]],
      },
    },
    biometricsCache: {
      enabled: false,
    },
  };

  const stage1State = {
    identifierCreationStage: 1,
    displayNameValue: "test",
    selectedAidType: 1,
    selectedTheme: 0,
    threshold: 1,
    scannedConections: [connectionsFix[3]],
    selectedConnections: [],
    ourIdentifier: "EJFrDZPw6atTkQr__ZoyOrl2ZzsN82wrx0m7I0BREKL2",
    newIdentifier: {
      id: "identifier",
      displayName: "test",
      createdAtUTC: new Date().toISOString(),
      theme: 0,
      creationStatus: CreationStatus.COMPLETE,
      groupMetadata: {
        groupId: "a2c1ac9e-fbaf-4cfd-83fb-7008d9661898",
        groupInitiator: true,
        groupCreated: true,
      },
    },
    color: IdentifierColor.One,
  };

  const dispatchMock = jest.fn();
  const storeMocked = {
    ...mockStore(initialState),
    dispatch: dispatchMock,
  };

  const innerSetState = jest.fn();
  const setState = jest.fn((args: any) => {
    if (typeof args === "function") {
      const result = args({});

      innerSetState(result);
    }
  });
  const setBlur = jest.fn();
  const resetModal = jest.fn();

  test("Render and initial multisig", async () => {
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <SetupConnections
          state={stage1State}
          setState={setState}
          componentId={"create-identifier"}
          setBlur={setBlur}
          resetModal={resetModal}
          resumeMultiSig={stage1State.newIdentifier}
          multiSigGroup={undefined}
          openAfterCreate
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getOobiMock).toBeCalledWith(
        stage1State.newIdentifier.id,
        initialState.stateCache.authentication.userName,
        stage1State.newIdentifier.groupMetadata.groupId
      );
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-initiate-multi-sig"));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setCurrentOperation(OperationType.IDLE)
      );
    });

    expect(innerSetState).toBeCalledWith({
      color: IdentifierColor.One,
      scannedConections: [connectionsFix[3]],
      displayNameValue: stage1State.displayNameValue,
      ourIdentifier: stage1State.ourIdentifier,
      identifierCreationStage: Stage.Members,
      selectedTheme: 0,
    });
  });

  describe("Initial Identifier", () => {
    const mockStore = configureStore();

    const stage1State = {
      identifierCreationStage: 1,
      displayNameValue: "test",
      selectedAidType: 1,
      selectedTheme: 0,
      threshold: 1,
      scannedConections: [],
      selectedConnections: [],
      ourIdentifier: "",
      newIdentifier: {
        id: "identifier",
        displayName: "test",
        createdAtUTC: new Date().toISOString(),
        theme: 0,
        creationStatus: CreationStatus.COMPLETE,
        groupMetadata: {
          groupId: "a2c1ac9e-fbaf-4cfd-83fb-7008d9661898",
          groupInitiator: true,
          groupCreated: true,
        },
      },
      color: IdentifierColor.One,
    };

    const dispatchMock = jest.fn();
    const storeMocked = {
      ...mockStore(store.getState()),
      dispatch: dispatchMock,
    };

    const setState = jest.fn();
    const setBlur = jest.fn();
    const resetModal = jest.fn();

    test("Renders Initial Multi Sig", async () => {
      const { getByTestId, getByText, getAllByText } = render(
        <Provider store={storeMocked}>
          <SetupConnections
            state={stage1State}
            setState={setState}
            componentId={"create-identifier-modal"}
            setBlur={setBlur}
            resetModal={resetModal}
            multiSigGroup={undefined}
            openAfterCreate
          />
        </Provider>
      );

      expect(
        getByText(EN_TRANSLATIONS.createidentifier.share.title)
      ).toBeInTheDocument();
      expect(
        getByText(EN_TRANSLATIONS.createidentifier.share.notes.top)
      ).toBeInTheDocument();
      expect(getByTestId("multisig-share-qr-code")).toBeInTheDocument();
      expect(
        getByTestId("multisig-copy-oobi-connection-button")
      ).toBeInTheDocument();
      expect(
        getByText(EN_TRANSLATIONS.createidentifier.share.notes.middle)
      ).toBeInTheDocument();
      expect(
        getByTestId("share-identifier-scan-button-round")
      ).toBeInTheDocument();
      act(() => {
        fireEvent.click(getByTestId("share-identifier-scan-button-round"));
      });
      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.createidentifier.share.scanalert.text)
        ).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.createidentifier.share.scanalert.confirm)
        ).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(
          getAllByText(
            EN_TRANSLATIONS.createidentifier.share.scanalert.cancel
          )[0]
        ).toBeInTheDocument();
      });
      act(() => {
        fireEvent.click(
          getByText(EN_TRANSLATIONS.createidentifier.share.scanalert.confirm)
        );
      });
      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.createidentifier.share.scanbutton)
        ).toBeInTheDocument();
      });
      expect(
        getByText(EN_TRANSLATIONS.createidentifier.share.subtitle)
      ).toBeInTheDocument();
      expect(
        getByText(EN_TRANSLATIONS.createidentifier.share.notes.bottom)
      ).toBeInTheDocument();
      expect(
        getByTestId("primary-button-initiate-multi-sig")
      ).toBeInTheDocument();
      expect(
        getByTestId("delete-button-initiate-multi-sig")
      ).toBeInTheDocument();
      await waitFor(() => {
        expect(
          getByTestId("primary-button-initiate-multi-sig").getAttribute(
            "disabled"
          )
        ).toBe("");
      });
    });

    test("Renders Initial Multi Sig: groupInitiator is false", async () => {
      const { getByTestId, getByText } = render(
        <Provider store={storeMocked}>
          <SetupConnections
            state={{
              ...stage1State,
              newIdentifier: {
                ...stage1State.newIdentifier,
                groupMetadata: {
                  ...stage1State.newIdentifier.groupMetadata,
                  groupInitiator: false,
                },
              },
            }}
            setState={setState}
            componentId={"create-identifier-modal"}
            setBlur={setBlur}
            resetModal={resetModal}
            multiSigGroup={undefined}
            openAfterCreate
          />
        </Provider>
      );

      expect(
        getByText(EN_TRANSLATIONS.createidentifier.share.notes.top)
      ).toBeInTheDocument();
      expect(
        getByText(EN_TRANSLATIONS.createidentifier.share.notes.middle)
      ).toBeInTheDocument();

      act(() => {
        fireEvent.click(getByTestId("multisig-copy-oobi-connection-button"));
      });

      await waitFor(() => {
        expect(dispatchMock).toBeCalledWith(
          setToastMsg(ToastMsgType.COPIED_TO_CLIPBOARD)
        );
      });
    });
  });

  describe("Resume Create Identifier", () => {
    const mockStore = configureStore();

    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
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
      },
      identifiersCache: {
        identifiers: {},
        favourites: [],
        multiSigGroup: {
          groupId: "b75838e5-98cb-46cf-9233-8bf3beca4cd3",
          connections: [connectionsFix[3]],
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const stage1State = {
      identifierCreationStage: 1,
      displayNameValue: "test",
      selectedAidType: 1,
      selectedTheme: 0,
      threshold: 1,
      scannedConections: [connectionsFix[3]],
      selectedConnections: [],
      ourIdentifier: "EJFrDZPw6atTkQr__ZoyOrl2ZzsN82wrx0m7I0BREKL2",
      newIdentifier: {
        id: "identifier",
        displayName: "test",
        createdAtUTC: new Date().toISOString(),
        theme: 0,
        creationStatus: CreationStatus.COMPLETE,
        groupMetadata: {
          groupId: "a2c1ac9e-fbaf-4cfd-83fb-7008d9661898",
          groupInitiator: true,
          groupCreated: true,
        },
      },
      color: IdentifierColor.One,
    };

    const dispatchMock = jest.fn();
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const setState = jest.fn();
    const setBlur = jest.fn();
    const resetModal = jest.fn();

    test("Renders Resume Multi Sig content", async () => {
      const { getByTestId, getByText } = render(
        <Provider store={storeMocked}>
          <SetupConnections
            state={stage1State}
            setState={setState}
            componentId={"create-identifier"}
            setBlur={setBlur}
            resetModal={resetModal}
            resumeMultiSig={stage1State.newIdentifier}
            multiSigGroup={undefined}
          />
        </Provider>
      );

      expect(
        getByText(EN_TRANSLATIONS.createidentifier.share.title)
      ).toBeInTheDocument();
      expect(
        getByText(EN_TRANSLATIONS.createidentifier.share.notes.top)
      ).toBeInTheDocument();
      expect(getByTestId("multisig-share-qr-code")).toBeInTheDocument();
      expect(getByTestId("copy-button-create-identifier")).toBeInTheDocument();
      expect(
        getByText(EN_TRANSLATIONS.createidentifier.share.notes.middle)
      ).toBeInTheDocument();
      expect(
        getByText(EN_TRANSLATIONS.createidentifier.share.subtitle)
      ).toBeInTheDocument();
      expect(getByText(connectionsFix[3].label)).toBeInTheDocument();
      expect(
        getByTestId("primary-button-initiate-multi-sig")
      ).toBeInTheDocument();
      expect(
        getByTestId("delete-button-initiate-multi-sig")
      ).toBeInTheDocument();
      await waitFor(() => {
        expect(
          getByTestId("primary-button-initiate-multi-sig").getAttribute(
            "disabled"
          )
        ).toBe("false");
      });

      act(() => {
        fireEvent.click(getByTestId("copy-button-create-identifier"));
      });

      await waitFor(() => {
        expect(dispatchMock).toBeCalledWith(
          setToastMsg(ToastMsgType.COPIED_TO_CLIPBOARD)
        );
      });

      act(() => {
        fireEvent.click(getByTestId("delete-button-initiate-multi-sig"));
      });

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.tabs.identifiers.details.delete.alert.title)
        ).toBeInTheDocument();
      });

      act(() => {
        fireEvent.click(
          getByText(
            EN_TRANSLATIONS.tabs.identifiers.details.delete.alert.confirm
          )
        );
      });

      await waitFor(() => {
        expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
      });

      await passcodeFiller(getByText, getByTestId, "193212");

      await waitFor(() => {
        expect(markIdentifierPendingDelete).toBeCalled();
      });
    });

    test("Renders Resume Multi Sig with groupInitiator is false", async () => {
      const { getByText } = render(
        <Provider store={storeMocked}>
          <SetupConnections
            state={stage1State}
            setState={setState}
            componentId={"create-identifier"}
            setBlur={setBlur}
            resetModal={resetModal}
            resumeMultiSig={{
              ...stage1State.newIdentifier,
              groupMetadata: {
                ...stage1State.newIdentifier.groupMetadata,
                groupInitiator: false,
              },
            }}
            multiSigGroup={undefined}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.createidentifier.receive.notes.top)
        ).toBeInTheDocument();
        expect(
          getByText(EN_TRANSLATIONS.createidentifier.receive.notes.middle)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Create group identifier - Setup Connection", () => {
    const mockStore = configureStore();

    const baseState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
          userName: "Duke",
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
        favourites: [],
        multiSigGroup: {
          groupId: "b75838e5-98cb-46cf-9233-8bf3beca4cd3",
          connections: [],
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    test("Renders Initial Multi Sig - CreationStatus PENDING", async () => {
      const pendingIdentifier = identifierFix[3];
      const transformedIdentifier = transformGroupIdentifier(pendingIdentifier);
      const identifierId = pendingIdentifier.id;

      const pendingState = {
        ...baseState,
        identifiersCache: {
          ...baseState.identifiersCache,
          identifiers: {
            [identifierId]: transformedIdentifier[identifierId], // Ensure the key matches the transformed identifier
          },
        },
      };

      const storeMockedPending = {
        ...mockStore(pendingState),
        dispatch: dispatchMock,
      };

      const { getByTestId } = render(
        <Provider store={storeMockedPending}>
          <SetupConnections
            state={stage1State}
            setState={setState}
            componentId={"create-identifier"}
            setBlur={setBlur}
            resetModal={resetModal}
            resumeMultiSig={stage1State.newIdentifier}
            multiSigGroup={{
              groupId: pendingIdentifier.groupMemberPre || "",
              connections: [],
            }}
            openAfterCreate
          />
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId("multisig-share-qr-code")).toHaveClass("blur");
      });
    });

    test("Renders Initial Multi Sig - CreationStatus COMPLETE", async () => {
      const completeIdentifier = identifierFix[4];
      const transformedIdentifier =
        transformGroupIdentifier(completeIdentifier);
      const identifierId = completeIdentifier.id;

      const completeState = {
        ...baseState,
        identifiersCache: {
          ...baseState.identifiersCache,
          identifiers: {
            [identifierId]: transformedIdentifier[identifierId], // Ensure the key matches the transformed identifier
          },
        },
      };

      const storeMockedComplete = {
        ...mockStore(completeState),
        dispatch: dispatchMock,
      };

      const { getByTestId } = render(
        <Provider store={storeMockedComplete}>
          <SetupConnections
            state={stage1State}
            setState={setState}
            componentId={"create-identifier"}
            setBlur={setBlur}
            resetModal={resetModal}
            resumeMultiSig={stage1State.newIdentifier}
            multiSigGroup={{
              groupId: identifierFix[4].groupMemberPre || "",
              connections: [],
            }}
            openAfterCreate
          />
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId("multisig-share-qr-code")).toHaveClass("blur");
      });
    });
  });
});
