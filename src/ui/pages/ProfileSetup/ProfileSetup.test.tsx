const createIdentifierMock = jest.fn(() =>
  Promise.resolve({ identifier: { displayName: "testUser" } })
);
const createOrUpdateBasicRecordMock = jest.fn(() => {
  return Promise.resolve(true);
});

import {
  BarcodeFormat,
  BarcodesScannedEvent,
  BarcodeValueType,
} from "@capacitor-mlkit/barcode-scanning";
import { IonInput, IonLabel } from "@ionic/react";
import { IonReactMemoryRouter } from "@ionic/react-router";
import { ionFireEvent } from "@ionic/react-test-utils";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";
import { Agent } from "../../../core/agent/agent";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import {
  setCurrentRoute,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import { profileCacheFixData } from "../../__fixtures__/storeDataFix";
import { CustomInputProps } from "../../components/CustomInput/CustomInput.types";
import { makeTestStore } from "../../utils/makeTestStore";
import { ProfileSetup } from "./ProfileSetup";
import {
  ConnectionShortDetails,
  ConnectionStatus,
  CreationStatus,
  OobiType,
} from "../../../core/agent/agent.types";
import { ToastMsgType } from "../../globals/types";

jest.mock("signify-ts", () => ({
  ...jest.requireActual("signify-ts"),
  Salter: jest.fn(() => ({
    qb64: "qb64",
  })),
}));

const connection: ConnectionShortDetails = {
  id: "ebfeb1ebc6f1c276ef71212ec20",
  label: "Cambridge University",
  createdAtUTC: "2017-01-14T19:23:24Z",
  status: ConnectionStatus.CONFIRMED,
  groupId: "0AAPHBnxoGK4tDuL4g87Eo9D",
  contactId: "conn-id-1",
};

const connectByOobiUrlMock = jest.fn((...arg: unknown[]): Promise<unknown> => {
  return Promise.resolve({
    type: OobiType.NORMAL,
    connection,
  });
});
jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      connections: {
        connectByOobiUrl: (...arg: unknown[]) => connectByOobiUrlMock(...arg),
      },
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
        createOrUpdateBasicRecord: () => createOrUpdateBasicRecordMock(),
        deleteById: jest.fn(() => {
          return Promise.resolve(true);
        }),
      },
      identifiers: {
        createIdentifier: createIdentifierMock,
        getIdentifiers: jest.fn(() => {
          return Promise.resolve([]);
        }),
      },
    },
  },
}));

jest.mock("../../components/CustomInput", () => ({
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
          value={props.value}
        />
      </>
    );
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children }: { children: any }) => children,
}));

jest.mock("@capacitor/core", () => {
  return {
    ...jest.requireActual("@capacitor/core"),
    Capacitor: {
      isNativePlatform: () => true,
    },
  };
});
const barcodes = [
  {
    displayValue: `http://keria:3902/oobi/EItAgpb3J4xQ5WLyIjFvNaeU07tYPF-dRp6VPHwqEama/agent/EGpkfv0Tw9pdtZHW2iSzLSm1ZreYyyD_1FJRpEl2xiB3?name=Leader&groupId=0AAPHBnxoGK4tDuL4g87Eo9D&groupName=MockGroup`,
    format: BarcodeFormat.QrCode,
    rawValue: `http://keria:3902/oobi/EItAgpb3J4xQ5WLyIjFvNaeU07tYPF-dRp6VPHwqEama/agent/EGpkfv0Tw9pdtZHW2iSzLSm1ZreYyyD_1FJRpEl2xiB3?name=Leader&groupId=0AAPHBnxoGK4tDuL4g87Eo9D&groupName=MockGroup`,
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

describe("Profile setup", () => {
  const history = createMemoryHistory();

  describe("Individual setup", () => {
    const mockStore = makeTestStore({
      stateCache: {
        routes: ["/"],
        authentication: {
          defaultProfile: "",
          loggedIn: true,
          time: 0,
          passcodeIsSet: true,
          seedPhraseIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: true,
          ssiAgentIsSet: true,
          ssiAgentUrl: "http://keria.com",
          recoveryWalletProgress: false,
          loginAttempt: {
            attempts: 0,
            lockedUntil: 0,
          },
          firstAppLaunch: true,
        },
        profileHistories: [],
      },

      profilesCache: profileCacheFixData,
    });

    const dispatchMock = jest.fn();

    const storeMocked = {
      ...mockStore,
      dispatch: dispatchMock,
    };

    test("Renders profile type screen", async () => {
      const { getByText } = render(
        <Provider store={storeMocked}>
          <ProfileSetup />
        </Provider>
      );
      expect(
        getByText(EN_TRANSLATIONS.setupprofile.profiletype.title)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.setupprofile.profiletype.description)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.setupprofile.profiletype.individual.title)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.setupprofile.profiletype.individual.text)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.setupprofile.profiletype.group.title)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.setupprofile.profiletype.group.text)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.setupprofile.button.confirm)
      ).toBeVisible();
    });

    test("Renders profile setup screen", async () => {
      const { getByText } = render(
        <Provider store={storeMocked}>
          <ProfileSetup />
        </Provider>
      );

      expect(
        getByText(EN_TRANSLATIONS.setupprofile.button.confirm)
      ).toBeVisible();

      fireEvent.click(getByText(EN_TRANSLATIONS.setupprofile.button.confirm));

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.setupprofile.profilesetup.title)
        ).toBeVisible();
      });

      // accept the current rendered subtitle text (shorter phrasing)
      expect(getByText(/Add a name for other members/i)).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.setupprofile.profilesetup.form.input)
      ).toBeVisible();
    });

    test("It should save user name when the primary button is clicked", async () => {
      const { getByText, getByTestId } = render(
        <Provider store={storeMocked}>
          <ProfileSetup />
        </Provider>
      );

      expect(
        getByText(EN_TRANSLATIONS.setupprofile.button.confirm)
      ).toBeVisible();

      fireEvent.click(getByText(EN_TRANSLATIONS.setupprofile.button.confirm));

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.setupprofile.profilesetup.title)
        ).toBeVisible();
      });

      act(() => {
        ionFireEvent.ionInput(getByTestId("profile-user-name"), "testUser");
      });

      await waitFor(() => {
        expect(
          (getByTestId("profile-user-name") as HTMLInputElement).value
        ).toBe("testUser");
      });

      act(() => {
        fireEvent.click(getByText(EN_TRANSLATIONS.inputrequest.button.confirm));
      });

      await waitFor(() => {
        expect(createIdentifierMock).toBeCalledWith({
          displayName: "testUser",
          theme: 0,
        });
      });
    });

    test("Display validate error message", async () => {
      const { getByText, getByTestId } = render(
        <Provider store={storeMocked}>
          <ProfileSetup />
        </Provider>
      );

      expect(
        getByText(EN_TRANSLATIONS.setupprofile.button.confirm)
      ).toBeVisible();

      fireEvent.click(getByText(EN_TRANSLATIONS.setupprofile.button.confirm));

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.setupprofile.profilesetup.title)
        ).toBeVisible();
      });

      act(() => {
        ionFireEvent.ionInput(getByTestId("profile-user-name"), "");
      });

      await waitFor(() => {
        expect(getByText(EN_TRANSLATIONS.nameerror.onlyspace)).toBeVisible();
      });

      act(() => {
        ionFireEvent.ionInput(getByTestId("profile-user-name"), "   ");
      });

      await waitFor(() => {
        expect(getByText(EN_TRANSLATIONS.nameerror.onlyspace)).toBeVisible();
      });

      act(() => {
        ionFireEvent.ionInput(
          getByTestId("profile-user-name"),
          "Duke Duke Duke Duke  Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke"
        );
      });

      await waitFor(() => {
        expect(getByText(EN_TRANSLATIONS.nameerror.maxlength)).toBeVisible();
      });

      ionFireEvent.ionInput(getByTestId("profile-user-name"), "Duke@@");

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.nameerror.hasspecialchar)
        ).toBeVisible();
      });
    });

    test("Show welcome screen after setup", async () => {
      const { getByText, getByTestId } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <ProfileSetup />
          </Provider>
        </IonReactMemoryRouter>
      );

      expect(
        getByText(EN_TRANSLATIONS.setupprofile.button.confirm)
      ).toBeVisible();

      fireEvent.click(getByText(EN_TRANSLATIONS.setupprofile.button.confirm));

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.setupprofile.profilesetup.title)
        ).toBeVisible();
      });

      ionFireEvent.ionInput(getByTestId("profile-user-name"), "testUser");

      await waitFor(() => {
        expect(
          (getByTestId("profile-user-name") as HTMLInputElement).value
        ).toBe("testUser");
      });

      jest
        .spyOn(Agent.agent.basicStorage, "createOrUpdateBasicRecord")
        .mockImplementation(() => {
          return Promise.resolve();
        });

      fireEvent.click(getByTestId("primary-button-profile-setup"));

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.setupprofile.finishsetup.text)
        ).toBeVisible();
        expect(
          getByText(
            EN_TRANSLATIONS.setupprofile.finishsetup.greeting.replace(
              "{{name}}",
              "testUser"
            )
          )
        ).toBeVisible();
      });

      fireEvent.click(getByText(EN_TRANSLATIONS.setupprofile.button.started));

      await waitFor(() => {
        expect(dispatchMock).toBeCalledWith(
          setCurrentRoute({
            path: TabsRoutePath.CREDENTIALS,
          })
        );
      });
    });
  });

  describe("Group setup", () => {
    const mockStore = makeTestStore({
      stateCache: {
        routes: ["/"],
        authentication: {
          defaultProfile: "",
          loggedIn: true,
          time: 0,
          passcodeIsSet: true,
          seedPhraseIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: true,
          ssiAgentIsSet: true,
          ssiAgentUrl: "http://keria.com",
          recoveryWalletProgress: false,
          loginAttempt: {
            attempts: 0,
            lockedUntil: 0,
          },
          firstAppLaunch: true,
        },
      },

      profilesCache: profileCacheFixData,
    });

    const dispatchMock = jest.fn();

    const storeMocked = {
      ...mockStore,
      dispatch: dispatchMock,
    };

    test("Renders group name setup screen", async () => {
      const { getByText, getByTestId } = render(
        <Provider store={storeMocked}>
          <ProfileSetup />
        </Provider>
      );

      fireEvent.click(getByTestId("identifier-select-group"));

      expect(
        getByText(EN_TRANSLATIONS.setupprofile.button.confirm)
      ).toBeVisible();

      fireEvent.click(getByText(EN_TRANSLATIONS.setupprofile.button.confirm));

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.setupprofile.groupsetupstart.title)
        ).toBeVisible();
      });

      expect(
        getByText(EN_TRANSLATIONS.setupprofile.groupsetupstart.form.input)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.setupprofile.groupsetupstart.description)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.setupprofile.groupsetupstart.form.joingroup)
      ).toBeVisible();
    });

    test("It should create group identifier when the primary button is clicked", async () => {
      const { getByText, getByTestId } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <ProfileSetup />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(getByTestId("identifier-select-group"));

      expect(
        getByText(EN_TRANSLATIONS.setupprofile.button.confirm)
      ).toBeVisible();

      fireEvent.click(getByText(EN_TRANSLATIONS.setupprofile.button.confirm));

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.setupprofile.groupsetupstart.title)
        ).toBeVisible();
      });

      act(() => {
        ionFireEvent.ionInput(getByTestId("profile-group-name"), "groupName");
      });

      await waitFor(() => {
        expect(
          (getByTestId("profile-group-name") as HTMLInputElement).value
        ).toBe("groupName");
      });

      act(() => {
        fireEvent.click(getByText(EN_TRANSLATIONS.inputrequest.button.confirm));
      });

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.setupprofile.profilesetup.title)
        ).toBeVisible();
      });

      act(() => {
        ionFireEvent.ionInput(getByTestId("profile-user-name"), "testUser");
      });

      await waitFor(() => {
        expect(
          (getByTestId("profile-user-name") as HTMLInputElement).value
        ).toBe("testUser");
      });

      act(() => {
        fireEvent.click(getByText(EN_TRANSLATIONS.inputrequest.button.confirm));
      });

      await waitFor(() => {
        expect(createIdentifierMock).toBeCalledWith(
          expect.objectContaining({
            displayName: "groupName",
            theme: 0,
            groupMetadata: expect.objectContaining({
              groupInitiator: true,
              groupCreated: false,
              userName: "testUser",
              initiatorName: "testUser",
              groupId: expect.any(String),
            }),
          })
        );
      });

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.setupprofile.finishsetup.text)
        ).toBeVisible();
        expect(
          getByText(
            EN_TRANSLATIONS.setupprofile.finishsetup.greeting.replace(
              "{{name}}",
              "testUser"
            )
          )
        ).toBeVisible();
      });

      fireEvent.click(getByText(EN_TRANSLATIONS.setupprofile.button.started));
    });

    test("Display validate error message", async () => {
      const { getByText, getByTestId } = render(
        <Provider store={storeMocked}>
          <ProfileSetup />
        </Provider>
      );

      fireEvent.click(getByTestId("identifier-select-group"));

      expect(
        getByText(EN_TRANSLATIONS.setupprofile.button.confirm)
      ).toBeVisible();

      fireEvent.click(getByText(EN_TRANSLATIONS.setupprofile.button.confirm));

      await waitFor(() => {
        expect(getByTestId("profile-group-name")).toBeVisible();
      });

      act(() => {
        ionFireEvent.ionInput(getByTestId("profile-group-name"), "");
      });

      await waitFor(() => {
        expect(getByText(EN_TRANSLATIONS.nameerror.onlyspace)).toBeVisible();
      });

      act(() => {
        ionFireEvent.ionInput(getByTestId("profile-group-name"), "   ");
      });

      await waitFor(() => {
        expect(getByText(EN_TRANSLATIONS.nameerror.onlyspace)).toBeVisible();
      });

      act(() => {
        ionFireEvent.ionInput(
          getByTestId("profile-group-name"),
          "Duke Duke Duke Duke  Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke"
        );
      });

      await waitFor(() => {
        expect(getByText(EN_TRANSLATIONS.nameerror.maxlength)).toBeVisible();
      });

      ionFireEvent.ionInput(getByTestId("profile-group-name"), "Duke@@");

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.nameerror.hasspecialchar)
        ).toBeVisible();
      });
    });
  });
});

describe("Profile setup: use as modal", () => {
  const mockStore = makeTestStore({
    stateCache: {
      routes: ["/"],
      authentication: {
        defaultProfile: "",
        loggedIn: true,
        time: 0,
        passcodeIsSet: true,
        seedPhraseIsSet: true,
        passwordIsSet: false,
        passwordIsSkipped: true,
        ssiAgentIsSet: true,
        ssiAgentUrl: "http://keria.com",
        recoveryWalletProgress: false,
        loginAttempt: {
          attempts: 0,
          lockedUntil: 0,
        },
        firstAppLaunch: false,
      },
      profileHistories: [],
    },

    profilesCache: profileCacheFixData,
  });

  const dispatchMock = jest.fn();

  const storeMocked = {
    ...mockStore,
    dispatch: dispatchMock,
  };

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

  test("Skip welcome and dipslay credential page after setup profile", async () => {
    const history = createMemoryHistory();
    const onClose = jest.fn();
    const { getByText, getByTestId } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={storeMocked}>
          <ProfileSetup onClose={onClose} />
        </Provider>
      </IonReactMemoryRouter>
    );

    expect(
      getByText(EN_TRANSLATIONS.setupprofile.button.confirm)
    ).toBeVisible();

    fireEvent.click(getByText(EN_TRANSLATIONS.setupprofile.button.confirm));

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.setupprofile.profilesetup.title)
      ).toBeVisible();
    });

    ionFireEvent.ionInput(getByTestId("profile-user-name"), "testUser");

    await waitFor(() => {
      expect((getByTestId("profile-user-name") as HTMLInputElement).value).toBe(
        "testUser"
      );
    });

    jest
      .spyOn(Agent.agent.basicStorage, "createOrUpdateBasicRecord")
      .mockImplementation(() => {
        return Promise.resolve();
      });

    fireEvent.click(getByTestId("primary-button-profile-setup"));
    await waitFor(() => {
      expect(createIdentifierMock).toBeCalledWith({
        displayName: "testUser",
        theme: 0,
      });
    });

    expect(onClose).toBeCalled();
    expect(dispatchMock).toBeCalledWith(
      setCurrentRoute({
        path: TabsRoutePath.CREDENTIALS,
      })
    );
  });

  test("Join group", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <ProfileSetup />
      </Provider>
    );

    fireEvent.click(getByTestId("identifier-select-group"));

    expect(
      getByText(EN_TRANSLATIONS.setupprofile.button.confirm)
    ).toBeVisible();

    fireEvent.click(getByText(EN_TRANSLATIONS.setupprofile.button.confirm));

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.setupprofile.groupsetupstart.title)
      ).toBeVisible();
    });

    fireEvent.click(getByTestId("join-group-button"));

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.scan.pastecontentbutton)).toBeVisible();
    });

    await waitFor(() => {
      expect(getByText("MockGroup")).toBeVisible();
    });

    fireEvent.click(getByTestId("primary-button-profile-setup"));

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.setupprofile.profilesetup.title)
      ).toBeVisible();
    });

    act(() => {
      ionFireEvent.ionInput(getByTestId("profile-user-name"), "testUser");
    });

    await waitFor(() => {
      expect((getByTestId("profile-user-name") as HTMLInputElement).value).toBe(
        "testUser"
      );
    });

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATIONS.inputrequest.button.confirm));
    });

    await waitFor(() => {
      expect(createIdentifierMock).toBeCalled();
    });
  });

  test("Invalid group invite url", async () => {
    const barcodes = [
      {
        displayValue: `http://keria:3902/oobi/EItAgpb3J4xQ5WLyIjFvNaeU07tYPF-dRp6VPHwqEama/agent/EGpkfv0Tw9pdtZHW2iSzLSm1ZreYyyD_1FJRpEl2xiB3?name=Leader&groupName=MockGroup`,
        format: BarcodeFormat.QrCode,
        rawValue: `http://keria:3902/oobi/EItAgpb3J4xQ5WLyIjFvNaeU07tYPF-dRp6VPHwqEama/agent/EGpkfv0Tw9pdtZHW2iSzLSm1ZreYyyD_1FJRpEl2xiB3?name=Leader&groupName=MockGroup`,
        valueType: BarcodeValueType.Url,
      },
    ];

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

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <ProfileSetup />
      </Provider>
    );

    fireEvent.click(getByTestId("identifier-select-group"));

    expect(
      getByText(EN_TRANSLATIONS.setupprofile.button.confirm)
    ).toBeVisible();

    fireEvent.click(getByText(EN_TRANSLATIONS.setupprofile.button.confirm));

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.setupprofile.groupsetupstart.title)
      ).toBeVisible();
    });

    fireEvent.click(getByTestId("join-group-button"));

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.scan.pastecontentbutton)).toBeVisible();
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.NOT_VALID_GROUP_INVITE)
      );
    });
  });

  test("Duplicate group", async () => {
    const barcodes = [
      {
        displayValue: `http://keria:3902/oobi/EItAgpb3J4xQ5WLyIjFvNaeU07tYPF-dRp6VPHwqEama/agent/EGpkfv0Tw9pdtZHW2iSzLSm1ZreYyyD_1FJRpEl2xiB3?name=Leader&groupId=0AAPHBnxoGK4tDuL4g87Eo9D&groupName=MockGroup`,
        format: BarcodeFormat.QrCode,
        rawValue: `http://keria:3902/oobi/EItAgpb3J4xQ5WLyIjFvNaeU07tYPF-dRp6VPHwqEama/agent/EGpkfv0Tw9pdtZHW2iSzLSm1ZreYyyD_1FJRpEl2xiB3?name=Leader&groupId=0AAPHBnxoGK4tDuL4g87Eo9D&groupName=MockGroup`,
        valueType: BarcodeValueType.Url,
      },
    ];

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

    const mockStore = makeTestStore({
      stateCache: {
        routes: ["/"],
        authentication: {
          defaultProfile: "",
          loggedIn: true,
          time: 0,
          passcodeIsSet: true,
          seedPhraseIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: true,
          ssiAgentIsSet: true,
          ssiAgentUrl: "http://keria.com",
          recoveryWalletProgress: false,
          loginAttempt: {
            attempts: 0,
            lockedUntil: 0,
          },
          firstAppLaunch: false,
        },
      },
      profilesCache: {
        profiles: {
          ["ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"]: {
            identity: {
              id: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb",
              displayName: "Professional ID",
              createdAtUTC: "2023-01-01T19:23:24Z",
              theme: 0,
              creationStatus: CreationStatus.COMPLETE,
              groupMetadata: {
                groupId: "0AAPHBnxoGK4tDuL4g87Eo9D",
                groupCreated: false,
                groupInitiator: false,
                userName: "test",
              },
            },
            connections: [],
            multisigConnections: [],
            peerConnections: [],
            credentials: [],
            archivedCredentials: [],
            notifications: [],
          },
        },
      },
    });

    const dispatchMock = jest.fn();

    const storeMocked = {
      ...mockStore,
      dispatch: dispatchMock,
    };

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <ProfileSetup />
      </Provider>
    );

    fireEvent.click(getByTestId("identifier-select-group"));

    expect(
      getByText(EN_TRANSLATIONS.setupprofile.button.confirm)
    ).toBeVisible();

    fireEvent.click(getByText(EN_TRANSLATIONS.setupprofile.button.confirm));

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.setupprofile.groupsetupstart.title)
      ).toBeVisible();
    });

    fireEvent.click(getByTestId("join-group-button"));

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.scan.pastecontentbutton)).toBeVisible();
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.DUPLICATE_GROUP_ID_ERROR)
      );
    });
  });

  test("Unexpected error", async () => {
    connectByOobiUrlMock.mockImplementation(async () => {
      throw new Error("Cannot resolve oobi");
    });

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <ProfileSetup />
      </Provider>
    );

    fireEvent.click(getByTestId("identifier-select-group"));

    expect(
      getByText(EN_TRANSLATIONS.setupprofile.button.confirm)
    ).toBeVisible();

    fireEvent.click(getByText(EN_TRANSLATIONS.setupprofile.button.confirm));

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.setupprofile.groupsetupstart.title)
      ).toBeVisible();
    });

    fireEvent.click(getByTestId("join-group-button"));

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.scan.pastecontentbutton)).toBeVisible();
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.CONNECTION_ERROR)
      );
    });
  });

  test("joinGroupMode opens scan directly", async () => {
    const onCloseMock = jest.fn();
    const { getByText } = render(
      <Provider store={storeMocked}>
        <ProfileSetup
          onClose={onCloseMock}
          joinGroupMode={true}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.scan.pastecontentbutton)).toBeVisible();
    });
  });

  test("normal mode shows profile type selection", async () => {
    const onCloseMock = jest.fn();
    const { getByText } = render(
      <Provider store={storeMocked}>
        <ProfileSetup
          onClose={onCloseMock}
          joinGroupMode={false}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.setupprofile.profiletype.title)
      ).toBeInTheDocument();
    });
  });

  test("handleCloseScan in joinGroupMode calls onClose", async () => {
    const onCloseMock = jest.fn();
    const { getAllByText } = render(
      <Provider store={storeMocked}>
        <ProfileSetup
          onClose={onCloseMock}
          joinGroupMode={true}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="profile-scanner"]')
      ).toBeVisible();
    });

    const cancelButtons = getAllByText(
      EN_TRANSLATIONS.setupprofile.button.cancel
    );
    fireEvent.click(cancelButtons[0]);

    await waitFor(() => {
      expect(onCloseMock).toBeCalledWith(true);
    });
  });
});
