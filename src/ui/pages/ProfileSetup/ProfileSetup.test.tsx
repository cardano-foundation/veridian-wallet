const createIdentifierMock = jest.fn(() =>
  Promise.resolve({ identifier: { displayName: "testUser" } })
);
const createOrUpdateBasicRecordMock = jest.fn(() => {
  return Promise.resolve(true);
});

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
import { setCurrentRoute } from "../../../store/reducers/stateCache";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import { CustomInputProps } from "../../components/CustomInput/CustomInput.types";
import { makeTestStore } from "../../utils/makeTestStore";
import { ProfileSetup } from "./ProfileSetup";

jest.mock("signify-ts", () => ({
  ...jest.requireActual("signify-ts"),
  Salter: jest.fn(() => ({
    qb64: "qb64",
  })),
}));

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
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

jest.mock("signify-ts", () => ({
  Salter: jest.fn().mockImplementation(() => {
    return { qb64: "" };
  }),
}));

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
      },
      connectionsCache: {
        connections: connectionsFix,
      },
      identifiersCache: {
        identifiers: filteredIdentifierFix,
        favourites: [],
      },
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

      expect(
        getByText(EN_TRANSLATIONS.setupprofile.profilesetup.description)
      ).toBeVisible();

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
      connectionsCache: {
        connections: connectionsFix,
      },
      identifiersCache: {
        identifiers: filteredIdentifierFix,
        favourites: [],
      },
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
          getByText(EN_TRANSLATIONS.setupprofile.groupsetup.title)
        ).toBeVisible();
      });

      expect(
        getByText(EN_TRANSLATIONS.setupprofile.groupsetup.form.input)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.setupprofile.groupsetup.description)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.setupprofile.groupsetup.form.joingroup)
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
          getByText(EN_TRANSLATIONS.setupprofile.groupsetup.title)
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
        expect(createIdentifierMock).toBeCalledWith({
          displayName: "groupName",
          theme: 0,
          groupMetadata: {
            groupId: "",
            groupInitiator: true,
            groupCreated: false,
            userName: "groupName",
          },
        });
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
    },
    connectionsCache: {
      connections: connectionsFix,
    },
    identifiersCache: {
      identifiers: filteredIdentifierFix,
      favourites: [],
    },
  });

  const dispatchMock = jest.fn();

  const storeMocked = {
    ...mockStore,
    dispatch: dispatchMock,
  };

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
});
