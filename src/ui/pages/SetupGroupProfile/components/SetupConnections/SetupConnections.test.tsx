import {
  BarcodeFormat,
  BarcodesScannedEvent,
  BarcodeValueType,
} from "@capacitor-mlkit/barcode-scanning";
import { IonInput } from "@ionic/react";
import { IonReactMemoryRouter } from "@ionic/react-router";
import { ionFireEvent } from "@ionic/react-test-utils";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import {
  ConnectionShortDetails,
  ConnectionStatus,
  OobiType,
} from "../../../../../core/agent/agent.types";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { RoutePath } from "../../../../../routes/paths";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { connectionsFix } from "../../../../__fixtures__/connectionsFix";
import { multisignIdentifierFix } from "../../../../__fixtures__/filteredIdentifierFix";
import { CustomInputProps } from "../../../../components/CustomInput/CustomInput.types";
import { ToastMsgType } from "../../../../globals/types";
import { makeTestStore } from "../../../../utils/makeTestStore";
import { GroupInfomation, Stage } from "../../SetupGroupProfile.types";
import { SetupConnections } from "./SetupConnections";
import { passcodeFiller } from "../../../../utils/passcodeFiller";
import { StorageMessage } from "../../../../../core/storage/storage.types";
import * as useScanHandleModule from "../../../../components/Scan/hook/useScanHandle";
import { Agent } from "../../../../../core/agent/agent";

const getOobiMock = jest.fn((...args: any) =>
  Promise.resolve(
    "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org:3902"
  )
);

const deleteIdentifier = jest.fn();
const markIdentifierPendingDelete = jest.fn();

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  isPlatform: () => true,
  getPlatforms: () => getPlatformMock(),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

const shareFnc = jest.fn(() => Promise.resolve(true));
jest.mock("@capacitor/share", () => ({
  ...jest.requireActual("@capacitor/share"),
  Share: {
    share: () => shareFnc(),
  },
}));

const connectByOobiUrlMock = jest.fn();
jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      connections: {
        getOobi: (...args: any) => getOobiMock(...args),
        connectByOobiUrl: (...arg: unknown[]) => connectByOobiUrlMock(...arg),
      },
      identifiers: {
        deleteIdentifier: () => deleteIdentifier(),
        markIdentifierPendingDelete: () => markIdentifierPendingDelete(),
      },
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
      basicStorage: {
        deleteById: jest.fn(),
      },
    },
  },
}));

const historyPushMock = jest.fn();
const initiatorGroupProfile = {
  ...multisignIdentifierFix[0],
  groupMetadata: {
    groupId: "549eb79f-856c-4bb7-8dd5-d5eed865906a",
    groupCreated: false,
    groupInitiator: true,
    userName: "Initiator",
  },
};
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    push: (args: any) => {
      historyPushMock(args);
    },
  }),
  useParams: () => ({
    id: initiatorGroupProfile.id,
  }),
}));

jest.mock("@capgo/capacitor-native-biometric", () => ({
  NativeBiometric: {
    isAvailable: jest.fn(() => Promise.resolve({ isAvailable: true, biometryType: "fingerprint" })),
    verifyIdentity: jest.fn(() => Promise.resolve()),
    getCredentials: jest.fn(() => Promise.reject(new Error("No credentials"))),
    setCredentials: jest.fn(() => Promise.resolve()),
    deleteCredentials: jest.fn(() => Promise.resolve()),
  },
  BiometryType: {
    FINGERPRINT: "fingerprint",
    FACE_ID: "faceId",
    TOUCH_ID: "touchId",
    IRIS_AUTHENTICATION: "iris",
    MULTIPLE: "multiple",
    NONE: "none",
  },
  BiometricAuthError: {
    USER_CANCEL: 1,
    USER_TEMPORARY_LOCKOUT: 2,
    USER_LOCKOUT: 3,
    BIOMETRICS_UNAVAILABLE: 4,
    UNKNOWN_ERROR: 5,
    BIOMETRICS_NOT_ENROLLED: 6,
  },
}));

const getPlatformMock = jest.fn(() => ["mobile"]);

const isNativePlatformMock = jest.fn(() => true);

jest.mock("@capacitor/core", () => {
  return {
    ...jest.requireActual("@capacitor/core"),
    Capacitor: {
      isNativePlatform: () => isNativePlatformMock(),
    },
  };
});
const groupId = "549eb79f-856c-4bb7-8dd5-d5eed865906a";
const barcodes = [
  {
    displayValue: `http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org/oobi/string1/agent/string2?groupId=${groupId}`,
    format: BarcodeFormat.QrCode,
    rawValue: `http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org/oobi/string1/agent/string2?groupId=${groupId}`,
    valueType: BarcodeValueType.Url,
  },
];

const addListener = jest.fn(
  (eventName: string, listenerFunc: (result: BarcodesScannedEvent) => void) => {
    setTimeout(() => {
      listenerFunc({
        barcodes,
      });
    }, 100);

    return {
      remove: jest.fn(),
    };
  }
);

const checkPermisson = jest.fn(() =>
  Promise.resolve({
    camera: "granted",
  })
);

const requestPermission = jest.fn();
const startScan = jest.fn();
const stopScan = jest.fn();
jest.mock("@capacitor-mlkit/barcode-scanning", () => {
  return {
    ...jest.requireActual("@capacitor-mlkit/barcode-scanning"),
    BarcodeScanner: {
      checkPermissions: () => checkPermisson(),
      requestPermissions: () => requestPermission(),
      addListener: (
        eventName: string,
        listenerFunc: (result: BarcodesScannedEvent) => void
      ) => addListener(eventName, listenerFunc),
      startScan: () => startScan(),
      stopScan: () => stopScan(),
      removeAllListeners: jest.fn(),
    },
  };
});

jest.mock("../../../../components/CustomInput", () => ({
  CustomInput: (props: CustomInputProps) => {
    return (
      <IonInput
        data-testid={props.dataTestId}
        onIonInput={(e) => {
          props.onChangeInput(e.detail.value as string);
        }}
      />
    );
  },
}));

describe("Setup Connection", () => {
  const initialState = {
    stateCache: {
      routes: [RoutePath.GROUP_PROFILE_SETUP],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
        passwordIsSet: false,
        userName: "Duke",
      },
      isOnline: true,
    },
    profilesCache: {
      profiles: {
        [initiatorGroupProfile.id]: {
          identity: initiatorGroupProfile,
        },
      },
      defaultProfile: initiatorGroupProfile.id,
      recentProfiles: [],
      multiSigGroup: {
        groupId,
        connections: [connectionsFix[3]],
      },
    },
  };

  let stage1State: GroupInfomation = {
    stage: Stage.SetupConnection,
    displayNameValue: "test",
    threshold: 1,
    scannedConections: [connectionsFix[3]],
    selectedConnections: [],
    ourIdentifier: initiatorGroupProfile.id,
    newIdentifier: initiatorGroupProfile,
  };

  const dispatchMock = jest.fn();
  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  const setState = jest.fn((updater: any) => {
    if (typeof updater === "function") {
      stage1State = updater(stage1State);
    } else {
      stage1State = updater;
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    addListener.mockImplementation(
      (
        eventName: string,
        listenerFunc: (result: BarcodesScannedEvent) => void
      ) => {
        setTimeout(() => {
          listenerFunc({
            barcodes,
          });
        }, 100);

        return {
          remove: jest.fn(),
        };
      }
    );
  });

  test("Render setup connection tab and open profiles modal", async () => {
    const history = createMemoryHistory();
    history.push(
      RoutePath.GROUP_PROFILE_SETUP.replace(":id", multisignIdentifierFix[0].id)
    );

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <SetupConnections
            state={stage1State}
            setState={setState}
            groupName="Test Group"
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() =>
      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.setupmembers.share)
      ).toBeVisible()
    );

    expect(getOobiMock).toHaveBeenCalled();

    const calledArgs = getOobiMock.mock.calls[0];
    expect(calledArgs[0]).toEqual(stage1State.newIdentifier.id);
    expect(calledArgs[1]).toEqual(initiatorGroupProfile.groupMetadata.userName);
    expect(calledArgs[2]).toEqual(initiatorGroupProfile.groupMetadata?.groupId);

    expect(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.setupmembers.actions.initiator
          .initiatebutton
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.setupmembers.actions.initiator.delete
          .button
      )
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.setupgroupprofile.setupmembers.notes.bottom)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.setupgroupprofile.setupmembers.share)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.setupgroupprofile.setupmembers.subtitle)
    ).toBeVisible();
    expect(getByText(initiatorGroupProfile.displayName)).toBeVisible();
    expect(getByTestId("avatar-button")).toBeVisible();

    fireEvent.click(getByTestId("avatar-button"));

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.profiles.title)).toBeVisible();
    });
  });

  test("Share", async () => {
    const history = createMemoryHistory();
    history.push(
      RoutePath.GROUP_PROFILE_SETUP.replace(":id", multisignIdentifierFix[0].id)
    );

    const { getByText } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <SetupConnections
            state={stage1State}
            setState={setState}
            groupName="Test Group"
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.setupgroupprofile.setupmembers.share)
    ).toBeVisible();

    fireEvent.click(
      getByText(EN_TRANSLATIONS.setupgroupprofile.setupmembers.share)
    );

    expect(shareFnc).toBeCalled();
  });

  test("Delete group profile", async () => {
    const history = createMemoryHistory();
    history.push(
      RoutePath.GROUP_PROFILE_SETUP.replace(":id", multisignIdentifierFix[0].id)
    );

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <SetupConnections
            state={stage1State}
            setState={setState}
            groupName="Test Group"
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() =>
      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.setupmembers.share)
      ).toBeVisible()
    );

    fireEvent.click(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.setupmembers.actions.initiator.delete
          .button
      )
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.setupgroupprofile.setupmembers.actions.initiator
            .delete.alert.title
        )
      ).toBeVisible();
    });

    fireEvent.click(
      getByText(
        EN_TRANSLATIONS.setupgroupprofile.setupmembers.actions.initiator.delete
          .alert.confirm
      )
    );

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(markIdentifierPendingDelete).toBeCalled();
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.IDENTIFIER_DELETED)
      );
    });
  });

  test("Render scan tab and scan connection", async () => {
    const connection: ConnectionShortDetails = {
      id: "ebfeb1ebc6f1c276ef71212ec20",
      label: "Cambridge University",
      createdAtUTC: "2017-01-14T19:23:24Z",
      status: ConnectionStatus.CONFIRMED,
      groupId,
      contactId: "conn-id-1",
    };
    connectByOobiUrlMock.mockImplementation(async () => {
      const res = {
        type: OobiType.NORMAL,
        connection,
      };
      setState((prev: GroupInfomation) => ({
        ...prev,
        scannedConections: [...(prev.scannedConections || []), connection],
      }));
      return res;
    });

    const history = createMemoryHistory();
    history.push(
      RoutePath.GROUP_PROFILE_SETUP.replace(":id", multisignIdentifierFix[0].id)
    );
    const { getByText, getByTestId, rerender, findByText } = render(
      <Provider store={makeTestStore(initialState)}>
        <IonReactMemoryRouter history={history}>
          <SetupConnections
            state={stage1State}
            setState={setState}
            groupName="Test Group"
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() =>
      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.setupmembers.share)
      ).toBeVisible()
    );

    expect(getByText(EN_TRANSLATIONS.shareprofile.buttons.scan)).toBeVisible();

    ionFireEvent.ionChange(getByTestId("setup-members-segment"), "scan");

    await waitFor(() => {
      expect(getByTestId("profile-scanner")).toBeVisible();
      expect(getByTestId("paste-content-button")).toBeVisible();
    });

    await waitFor(() => {
      expect(connectByOobiUrlMock).toBeCalled();
    });

    const confirmedConnection = {
      ...connection,
      status: ConnectionStatus.CONFIRMED,
    };

    const updatedInitialState: any = {
      ...initialState,
      profilesCache: {
        ...initialState.profilesCache,
        multiSigGroup: {
          ...initialState.profilesCache.multiSigGroup,
          connections: [
            ...(initialState.profilesCache.multiSigGroup?.connections || []),
            confirmedConnection,
          ],
        },
      },
    };
    rerender(
      <Provider store={makeTestStore(updatedInitialState)}>
        <IonReactMemoryRouter history={history}>
          <SetupConnections
            state={stage1State}
            setState={setState}
            groupName="Test Group"
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() => expect(connectByOobiUrlMock).toBeCalled());

    expect(
      stage1State.scannedConections.some((c: any) => c.id === connection.id)
    ).toBe(true);

    expect(
      updatedInitialState.profilesCache.multiSigGroup.connections.some(
        (c: any) => c.id === connection.id
      )
    ).toBe(true);

    expect(setState).toBeCalled();
  }, 1000000);

  test("Scan invalid connection", async () => {
    addListener.mockImplementation(
      (
        eventName: string,
        listenerFunc: (result: BarcodesScannedEvent) => void
      ) => {
        setTimeout(() => {
          listenerFunc({
            barcodes: [
              {
                displayValue: "http",
                format: BarcodeFormat.QrCode,
                rawValue: "http",
                valueType: BarcodeValueType.Url,
              },
            ],
          });
        }, 100);

        return {
          remove: jest.fn(),
        };
      }
    );

    const history = createMemoryHistory();
    history.push(
      RoutePath.GROUP_PROFILE_SETUP.replace(":id", multisignIdentifierFix[0].id)
    );

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <SetupConnections
            state={stage1State}
            setState={setState}
            groupName="Test Group"
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() =>
      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.setupmembers.share)
      ).toBeVisible()
    );

    expect(getByText(EN_TRANSLATIONS.shareprofile.buttons.scan)).toBeVisible();

    ionFireEvent.ionChange(getByTestId("setup-members-segment"), "scan");

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.CONNECTION_ERROR)
      );
    });
  });

  test("Scan duplication", async () => {
    addListener.mockImplementation(
      (
        eventName: string,
        listenerFunc: (result: BarcodesScannedEvent) => void
      ) => {
        setTimeout(() => {
          listenerFunc({
            barcodes: [
              {
                displayValue:
                  "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org/oobi/string1/agent/string2?groupId=2313213",
                format: BarcodeFormat.QrCode,
                rawValue:
                  "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org/oobi/string1/agent/string2?groupId=3123213",
                valueType: BarcodeValueType.Url,
              },
            ],
          });
        }, 100);

        return {
          remove: jest.fn(),
        };
      }
    );

    const history = createMemoryHistory();
    history.push(
      RoutePath.GROUP_PROFILE_SETUP.replace(":id", multisignIdentifierFix[0].id)
    );

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <SetupConnections
            state={stage1State}
            setState={setState}
            groupName="Test Group"
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() =>
      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.setupmembers.share)
      ).toBeVisible()
    );

    expect(getByText(EN_TRANSLATIONS.shareprofile.buttons.scan)).toBeVisible();

    ionFireEvent.ionChange(getByTestId("setup-members-segment"), "scan");

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.GROUP_ID_NOT_MATCH_ERROR)
      );
    });
  });

  test("Scan connection when group did not match", async () => {
    connectByOobiUrlMock.mockImplementation(() => {
      return Promise.reject(
        new Error(StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG)
      );
    });

    const history = createMemoryHistory();
    history.push(
      RoutePath.GROUP_PROFILE_SETUP.replace(":id", multisignIdentifierFix[0].id)
    );

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <SetupConnections
            state={stage1State}
            setState={setState}
            groupName="Test Group"
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() =>
      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.setupmembers.share)
      ).toBeVisible()
    );

    expect(getByText(EN_TRANSLATIONS.shareprofile.buttons.scan)).toBeVisible();

    ionFireEvent.ionChange(getByTestId("setup-members-segment"), "scan");

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.DUPLICATE_CONNECTION)
      );
    });
  });
});
