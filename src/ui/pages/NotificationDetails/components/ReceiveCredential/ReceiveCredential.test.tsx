const verifySecretMock = jest.fn().mockResolvedValue(true);

import { BiometryType } from "@capgo/capacitor-native-biometric";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";

import { IdentifierType } from "../../../../../core/agent/services/identifier.types";
import { KeyStoreKeys } from "../../../../../core/storage";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../../routes/paths";
import { showGenericError } from "../../../../../store/reducers/stateCache";
import { connectionsForNotificationsValues } from "../../../../__fixtures__/connectionsFix";
import { credsFixAcdc } from "../../../../__fixtures__/credsFix";
import {
  filteredIdentifierFix,
  filteredIdentifierMapFix,
} from "../../../../__fixtures__/filteredIdentifierFix";
import { identifierFix } from "../../../../__fixtures__/identifierFix";
import { notificationsFix } from "../../../../__fixtures__/notificationsFix";
import { passcodeFiller } from "../../../../utils/passcodeFiller";
import { ReceiveCredential } from "./ReceiveCredential";
import { makeTestStore } from "../../../../utils/makeTestStore";
import { profileCacheFixData } from "../../../../__fixtures__/storeDataFix";

jest.useFakeTimers();

const deleteNotificationMock = jest.fn((id: string) => Promise.resolve(id));
const admitAcdcFromGrantMock = jest.fn(
  (id: string) =>
    new Promise((res) => {
      setTimeout(() => {
        res({
          id,
        });
      }, 700);
    })
);
const getLinkedGroupFromIpexGrantMock = jest.fn();
const getAcdcFromIpexGrantMock = jest.fn();
jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      keriaNotifications: {
        deleteNotificationRecordById: (id: string) =>
          deleteNotificationMock(id),
      },
      ipexCommunications: {
        admitAcdcFromGrant: (id: string) => admitAcdcFromGrantMock(id),
        getAcdcFromIpexGrant: () => getAcdcFromIpexGrantMock(),
        getLinkedGroupFromIpexGrant: () => getLinkedGroupFromIpexGrantMock(),
      },
      identifiers: {
        getIdentifier: jest.fn(() => Promise.resolve(identifierFix[0])),
      },
      connections: {
        getOobi: jest.fn(),
      },
      auth: {
        verifySecret: verifySecretMock,
      },
    },
  },
}));

jest.mock("../../../../hooks/useBiometricsHook", () => ({
  useBiometricAuth: jest.fn(() => ({
    biometricsIsEnabled: false,
    biometricInfo: {
      isAvailable: true,
      hasCredentials: false,
      biometryType: BiometryType.FINGERPRINT,
    },
    handleBiometricAuth: jest.fn(() => Promise.resolve(true)),
    setBiometricsIsEnabled: jest.fn(),
  })),
}));

const dispatchMock = jest.fn();

const initialState = {
  stateCache: {
    routes: [TabsRoutePath.NOTIFICATIONS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
  },
  profilesCache: {
    ...profileCacheFixData,
    defaultProfile: filteredIdentifierFix[2].id,
    profiles: {
      ...profileCacheFixData.profiles,
      [filteredIdentifierFix[2].id]: {
        identity: {
          id: filteredIdentifierFix[2].id,
          displayName:
            profileCacheFixData.profiles[filteredIdentifierFix[2].id]?.identity
              ?.displayName || "Test MS",
          createdAtUTC: "2000-01-01T00:00:00.000Z",
          groupMetadata: true,
        },
        connections:
          profileCacheFixData.profiles[filteredIdentifierFix[2].id]
            ?.connections || [],
        multisigConnections: [
          {
            id: "member-1",
            contactId: filteredIdentifierFix[2].id,
            label: "Member 1",
            groupId: "g1",
          },
          {
            id: "member-2",
            contactId: filteredIdentifierFix[2].id,
            label: "Member 2",
            groupId: "g1",
          },
        ],
        peerConnections: [],
        credentials: [],
        archivedCredentials: [],
        notifications: [],
      },
    },
  },
  biometricsCache: {
    enabled: false,
  },
};

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  isPlatform: () => true,
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

describe("Receive credential", () => {
  beforeEach(() => {
    getAcdcFromIpexGrantMock.mockImplementation(() =>
      Promise.resolve({
        ...credsFixAcdc[0],
        status: "pending",
      })
    );
  });

  test("Render and decline", async () => {
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };
    const { getAllByText, getByText, getByTestId, queryByText } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={jest.fn()}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    expect(
      getAllByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.receive.title
      )[0]
    ).toBeVisible();

    expect(
      queryByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.alert.textdecline
      )
    ).toBeNull();

    act(() => {
      fireEvent.click(getByTestId("decline-button-creadential-request"));
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.identifier.alert
            .textdecline
        )
      ).toBeVisible();
    });

    fireEvent.click(
      getByTestId("multisig-request-alert-decline-confirm-button")
    );

    await waitFor(() => {
      expect(deleteNotificationMock).toBeCalled();
    });

    await waitFor(() => {
      expect(deleteNotificationMock).toBeCalled();
    });
  });

  test("Accept", async () => {
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const backMock = jest.fn();
    const { getAllByText, getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    expect(
      getAllByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.receive.title
      )[0]
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-creadential-request"));
    });

    await waitFor(() => {
      expect(getByTestId("verify-passcode")).toBeVisible();
    });

    await waitFor(() => {
      expect(getByTestId("passcode-button-1")).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(verifySecretMock).toHaveBeenCalledWith(
        KeyStoreKeys.APP_PASSCODE,
        "193212"
      );
    });

    await waitFor(() => {
      expect(admitAcdcFromGrantMock).toBeCalledWith(notificationsFix[0].id);
    });
  }, 10000);

  test("Race condition protection: prevents re-fetching while accepting", async () => {
    const storeMocked = {
      ...makeTestStore({
        ...initialState,
        profilesCache: {
          ...initialState.profilesCache,
          profiles: {
            ...initialState.profilesCache.profiles,
            [filteredIdentifierFix[2].id]: {
              ...initialState.profilesCache.profiles[
                filteredIdentifierFix[2].id
              ],
              identity: {
                ...initialState.profilesCache.profiles[
                  filteredIdentifierFix[2].id
                ].identity,
                groupMemberPre: "member-1",
              },
            },
          },
        },
      }),
      dispatch: dispatchMock,
    };

    const backMock = jest.fn();

    getAcdcFromIpexGrantMock.mockResolvedValue({
      ...credsFixAcdc[0],
      identifierType: IdentifierType.Group,
      identifierId: filteredIdentifierFix[2].id,
    });

    // We also need to mock valid response for getLinkedGroupFromIpexGrantMock
    // so the component doesn't error out before we can test this race condition
    getLinkedGroupFromIpexGrantMock.mockResolvedValue({
      threshold: { signingThreshold: 2 },
      members: ["member-1", "member-2"],
      othersJoined: ["member-1"],
      linkedRequest: {
        accepted: false,
      },
    });

    const { getByTestId, getByText, container } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request-race"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    // 1. Initial fetch should happen
    await waitFor(() => {
      expect(getLinkedGroupFromIpexGrantMock).toBeCalledTimes(1);
    });

    // 2. Clear mock to strictly track new calls
    getLinkedGroupFromIpexGrantMock.mockClear();

    // 3. Start Acceptance
    act(() => {
      fireEvent.click(getByTestId("primary-button-creadential-request-race"));
    });

    await waitFor(() => {
      expect(getByTestId("verify-passcode")).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    // 4. Verify we are in "isAccepting" state (via CSS class)
    // The component wrapper should have "animation-on" class
    await waitFor(() => {
      const page = container.getElementsByClassName(
        "creadential-request-race-receive-credential"
      )[0];
      expect(page).toHaveClass("animation-on");
    });

    // 5. Simulate a scenario that might trigger fetching (e.g., fast forward time slightly or re-render)
    // In a real browser, useOnlineStatusEffect properties might change.
    // Here we ensure that NO new calls to getLinkedGroupFromIpexGrantMock happen immediately.

    // We advance time but NOT enough to finish the accept promise (700ms)
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // 6. Assert NO new calls occurred
    expect(getLinkedGroupFromIpexGrantMock).not.toBeCalled();

    // 7. Finish the process
    act(() => {
      jest.advanceTimersByTime(500); // Complete the 700ms + buffer
    });

    await waitFor(() => {
      expect(admitAcdcFromGrantMock).toBeCalledWith(notificationsFix[0].id);
    });
  }, 10000);

  test("Open cred detail", async () => {
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const backMock = jest.fn();
    const { getAllByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    expect(
      getAllByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.receive.title
      )[0]
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("cred-detail-btn"));
    });

    await waitFor(() => {
      expect(getByTestId("receive-credential-detail-modal")).toBeVisible();
    });
  }, 10000);

  test("Open missing issuer modal", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.NOTIFICATIONS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
      },
      profilesCache: profileCacheFixData,
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const backMock = jest.fn();
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[1]}
        />
      </Provider>
    );

    expect(getByTestId("show-missing-issuer-icon")).toBeVisible();

    fireEvent.click(getByTestId("show-missing-issuer-icon"));

    await waitFor(() => {
      expect(getByTestId("missing-issuer-alert")).toBeVisible();
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.identifier.alert
            .missingissuer.text
        )
      ).toBeVisible();
    });
  });

  test("Show error when cred open", async () => {
    const storeMocked = {
      ...makeTestStore({
        ...initialState,
        stateCache: {
          routes: [TabsRoutePath.NOTIFICATIONS],
          authentication: {
            loggedIn: true,
            time: Date.now(),
            passcodeIsSet: true,
          },
          isOnline: true,
        },
      }),
      dispatch: dispatchMock,
    };

    getAcdcFromIpexGrantMock.mockImplementation(() => {
      return Promise.reject(new Error("Get acdc failed"));
    });

    const backMock = jest.fn();
    const { unmount } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(showGenericError(true));
      expect(backMock).toBeCalled();
    });

    unmount();
  });
});

describe("Credential request: Multisig", () => {
  const initialState = {
    stateCache: {
      routes: [TabsRoutePath.NOTIFICATIONS],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
      },
      isOnline: true,
    },
    profilesCache: {
      ...profileCacheFixData,
      profiles: {
        ...profileCacheFixData.profiles,
        [filteredIdentifierFix[2].id]: {
          identity: {
            id: filteredIdentifierFix[2].id,
            displayName:
              profileCacheFixData.profiles[filteredIdentifierFix[2].id]
                ?.identity?.displayName || "Test MS",
            createdAtUTC: "2000-01-01T00:00:00.000Z",
            groupMetadata: true,
          },
          connections:
            profileCacheFixData.profiles[filteredIdentifierFix[2].id]
              ?.connections || [],
          multisigConnections: [
            {
              id: "member-1",
              contactId: filteredIdentifierFix[2].id,
              label: "Member 1",
              groupId: "g1",
            },
            {
              id: "member-2",
              contactId: filteredIdentifierFix[2].id,
              label: "Member 2",
              groupId: "g1",
            },
          ],
          peerConnections: [],
          credentials: [],
          archivedCredentials: [],
          notifications: [],
        },
      },
      defaultProfile: filteredIdentifierFix[2].id,
    },
    biometricsCache: {
      enabled: false,
    },
  };

  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  test("Multisig credential request", async () => {
    const backMock = jest.fn();

    getAcdcFromIpexGrantMock.mockResolvedValue({
      ...credsFixAcdc[0],
      identifierType: IdentifierType.Group,
      identifierId: filteredIdentifierFix[2].id,
    });

    getLinkedGroupFromIpexGrantMock.mockResolvedValue({
      threshold: { signingThreshold: 2 },
      members: ["member-1", "member-2"],
      othersJoined: [],
      linkedRequest: {
        accepted: false,
      },
    });

    const { getByText } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.receive.members
        )
      ).toBeVisible();

      expect(getByText("Member 1")).toBeVisible();

      expect(getByText("Member 2")).toBeVisible();
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.receive
          .initiatoracceptedalert
      )
    ).toBeVisible();

    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.ok)
    ).toBeVisible();
  });

  test("Hide alert when group initiator accept cred", async () => {
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const backMock = jest.fn();

    getAcdcFromIpexGrantMock.mockResolvedValue({
      ...credsFixAcdc[0],
      identifierType: IdentifierType.Group,
      identifierId: filteredIdentifierFix[2].id,
    });

    getLinkedGroupFromIpexGrantMock.mockResolvedValue({
      threshold: { signingThreshold: 2 },
      members: ["member-1", "member-2"],
      othersJoined: ["member-1"],
      linkedRequest: {
        accepted: false,
      },
    });

    const { getByText, queryByText } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.receive.members
        )
      ).toBeVisible();

      expect(getByText("Member 1")).toBeVisible();

      expect(getByText("Member 2")).toBeVisible();
    });

    expect(
      queryByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.receive
          .initiatoracceptedalert
      )
    ).toBeNull();
  });

  test("Multisig credential request: max threshold", async () => {
    const backMock = jest.fn();

    getAcdcFromIpexGrantMock.mockResolvedValue({
      ...credsFixAcdc[0],
      identifierType: IdentifierType.Group,
      identifierId: filteredIdentifierFix[2].id,
    });

    getLinkedGroupFromIpexGrantMock.mockResolvedValue({
      threshold: { signingThreshold: 2 },
      members: ["member-1", "member-2", "member-3"],
      othersJoined: ["member-1", "member-2"],
      linkedRequest: {
        accepted: false,
      },
    });

    const { getByText, unmount, queryByTestId } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.addcred)
      ).toBeVisible();
    });

    await waitFor(() => {
      expect(queryByTestId("spinner")).toBeNull();
    });

    unmount();
  });

  test("Multisig credential request: Accepted", async () => {
    const backMock = jest.fn();

    getAcdcFromIpexGrantMock.mockResolvedValue({
      ...credsFixAcdc[0],
      identifierType: IdentifierType.Group,
      identifierId: filteredIdentifierFix[2].id,
    });

    getLinkedGroupFromIpexGrantMock.mockResolvedValue({
      threshold: { signingThreshold: 2 },
      members: ["member-1", "member-2"],
      othersJoined: ["member-1"],
      linkedRequest: {
        accepted: true,
        current: "currentadmitsaid",
      },
    });

    const { queryByTestId, unmount, findByText, queryByText, getByText } =
      render(
        <Provider store={storeMocked}>
          <ReceiveCredential
            pageId="creadential-request-1"
            activeStatus
            handleBack={backMock}
            notificationDetails={notificationsFix[0]}
          />
        </Provider>
      );

    expect(queryByTestId("primary-button-creadential-request")).toBe(null);
    expect(queryByTestId("decline-button-creadential-request")).toBe(null);

    const memberName = queryByText("Member 1");
    expect(memberName).toBeNull();

    await waitFor(() => {
      expect(getLinkedGroupFromIpexGrantMock).toBeCalled();
    });

    await waitFor(() => {
      expect(queryByTestId("spinner")).toBeNull();
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.receive.members
        )
      ).toBeVisible();
    });

    const memberName1 = await findByText("Member 1");
    const memberName2 = await findByText("Member 2");

    await waitFor(() => {
      expect(memberName1).toBeVisible();
      expect(memberName2).toBeVisible();
    });

    unmount();
  });
});
