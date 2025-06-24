import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import EN_TRANSLATIONS from "../../../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../../../routes/paths";
import { connectionsForNotifications } from "../../../../../__fixtures__/connectionsFix";
import { credRequestFix } from "../../../../../__fixtures__/credRequestFix";
import { notificationsFix } from "../../../../../__fixtures__/notificationsFix";
import { passcodeFiller } from "../../../../../utils/passcodeFiller";
import { CredentialRequestInformation } from "./CredentialRequestInformation";
import { credsFixAcdc } from "../../../../../__fixtures__/credsFix";
import { filteredIdentifierMapFix } from "../../../../../__fixtures__/filteredIdentifierFix";

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

const deleteNotificationMock = jest.fn((id: string) => Promise.resolve(id));
const joinMultisigOfferMock = jest.fn();
const getOfferedCredentialSaid = jest.fn(() => "cred-id");

jest.mock("../../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      keriaNotifications: {
        deleteNotificationRecordById: (id: string) =>
          deleteNotificationMock(id),
      },
      ipexCommunications: {
        joinMultisigOffer: () => joinMultisigOfferMock(),
        getOfferedCredentialSaid: () => getOfferedCredentialSaid(),
      },
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
      credentials: {
        getCredentialDetailsById: jest.fn(() =>
          Promise.resolve(credsFixAcdc[0])
        ),
      },
      connections: {
        getConnectionShortDetailById: jest.fn(() => Promise.resolve([])),
      },
    },
  },
}));

const mockStore = configureStore();
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
  connectionsCache: {
    connections: connectionsForNotifications,
  },
  notificationsCache: {
    notifications: notificationsFix,
  },
  credsCache: {
    creds: [{ ...credsFixAcdc[0], id: "cred-id" }],
  },
  credsArchivedCache: {
    creds: [],
  },
  biometricsCache: {
    enabled: false,
  },
  identifiersCache: {
    identifiers: filteredIdentifierMapFix,
  },
};

describe("Credential request information", () => {
  test("Render and decline", async () => {
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };
    const { getByText, getByTestId, queryByText, unmount } = render(
      <Provider store={storeMocked}>
        <CredentialRequestInformation
          pageId="multi-sign"
          activeStatus
          onBack={jest.fn()}
          onAccept={jest.fn()}
          notificationDetails={notificationsFix[4]}
          credentialRequest={credRequestFix}
          linkedGroup={null}
          onReloadData={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.title
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("decline-button-multi-sign"));
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.alert.textdecline
        )
      ).toBeVisible();
    });

    fireEvent.click(
      getByTestId("multisig-request-alert-decline-confirm-button")
    );

    fireEvent.click(
      getByTestId("multisig-request-alert-decline-cancel-button")
    );

    await waitFor(() => {
      expect(
        queryByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.alert.textdecline
        )
      ).toBeNull();
    });

    await waitFor(() => {
      expect(deleteNotificationMock).toBeCalled();
    });

    unmount();
    document.getElementsByTagName("body")[0].innerHTML = "";
  });
});

describe("Credential request information: multisig", () => {
  const linkedGroup = {
    linkedRequest: {
      accepted: false,
      current: "",
      previous: undefined,
    },
    threshold: "2",
    members: ["member-1", "member-2"],
    othersJoined: [],
    memberInfos: [
      {
        aid: "member-1",
        name: "Member 1",
        joined: false,
      },
      {
        aid: "member-2",
        name: "Member 2",
        joined: false,
      },
    ],
  };

  test("Initiator open request before proposing", async () => {
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const accept = jest.fn();

    const { getByText, getByTestId, queryByText } = render(
      <Provider store={storeMocked}>
        <CredentialRequestInformation
          pageId="multi-sign"
          activeStatus
          onBack={jest.fn()}
          onAccept={accept}
          userAID="member-1"
          notificationDetails={notificationsFix[4]}
          credentialRequest={credRequestFix}
          linkedGroup={linkedGroup}
          onReloadData={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.title
        )
      ).toBeVisible();
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.initiatorselectcred
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      queryByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposalfrom
      )
    ).toBeNull();
    expect(
      queryByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposedcred
      )
    ).toBeNull();
    expect(
      queryByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.accept)
    ).toBeNull();
    expect(
      queryByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.reject)
    ).toBeNull();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.buttons.choosecredential
      )
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    expect(accept).toBeCalled();
  });

  test("Initiator opens request after proposing and before threshold is met", async () => {
    const linkedGroup = {
      linkedRequest: {
        accepted: true,
        current: "cred-id",
        previous: undefined,
      },
      threshold: "2",
      members: ["member-1", "member-2"],
      othersJoined: [],
      memberInfos: [
        {
          aid: "member-1",
          name: "Member 1",
          joined: true,
        },
        {
          aid: "member-2",
          name: "Member 2",
          joined: false,
        },
      ],
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const back = jest.fn();

    const { getByText, getByTestId, queryByText } = render(
      <Provider store={storeMocked}>
        <CredentialRequestInformation
          pageId="multi-sign"
          activeStatus
          onBack={back}
          onAccept={jest.fn()}
          userAID="member-1"
          notificationDetails={notificationsFix[4]}
          credentialRequest={credRequestFix}
          linkedGroup={linkedGroup}
          onReloadData={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.title
        )
      ).toBeVisible();
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.initiatorselectedcred
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      queryByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposalfrom
      )
    ).toBeNull();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposedcred
      )
    ).toBeVisible();
    expect(
      queryByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.accept)
    ).toBeNull();
    expect(
      queryByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.reject)
    ).toBeNull();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.ok)
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    expect(back).toBeCalled();
  });

  test("Initiator opens request after proposing and after threshold is met", async () => {
    const linkedGroup = {
      linkedRequest: {
        accepted: true,
        current: "cred-id",
        previous: undefined,
      },
      threshold: "2",
      members: ["member-1", "member-2"],
      othersJoined: ["member-2"],
      memberInfos: [
        {
          aid: "member-1",
          name: "Member 1",
          joined: true,
        },
        {
          aid: "member-2",
          name: "Member 2",
          joined: true,
        },
      ],
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const back = jest.fn();

    const { getByText, getByTestId, queryByText } = render(
      <Provider store={storeMocked}>
        <CredentialRequestInformation
          pageId="multi-sign"
          activeStatus
          onBack={back}
          onAccept={jest.fn()}
          userAID="member-1"
          notificationDetails={notificationsFix[4]}
          credentialRequest={credRequestFix}
          linkedGroup={linkedGroup}
          onReloadData={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.title
        )
      ).toBeVisible();
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.reachthreshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      queryByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposalfrom
      )
    ).toBeNull();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposedcred
      )
    ).toBeVisible();
    expect(
      queryByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.accept)
    ).toBeNull();
    expect(
      queryByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.reject)
    ).toBeNull();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.ok)
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    expect(back).toBeCalled();
  });

  test("Initiator opens request after proposing and before threshold is met, but has deleted the proposed credential", async () => {
    const linkedGroup = {
      linkedRequest: {
        accepted: true,
        current: "cred-id",
        previous: undefined,
      },
      threshold: "2",
      members: ["member-1", "member-2"],
      othersJoined: [],
      memberInfos: [
        {
          aid: "member-1",
          name: "Member 1",
          joined: true,
        },
        {
          aid: "member-2",
          name: "Member 2",
          joined: false,
        },
      ],
    };

    const storeMocked = {
      ...mockStore({
        ...initialState,
        credsCache: {
          creds: [],
        },
      }),
      dispatch: dispatchMock,
    };

    const back = jest.fn();

    const { getByText, getByTestId, queryByText } = render(
      <Provider store={storeMocked}>
        <CredentialRequestInformation
          pageId="multi-sign"
          activeStatus
          onBack={back}
          onAccept={jest.fn()}
          userAID="member-1"
          notificationDetails={notificationsFix[4]}
          credentialRequest={credRequestFix}
          linkedGroup={linkedGroup}
          onReloadData={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.title
        )
      ).toBeVisible();
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.initiatorselectedcred
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      queryByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposalfrom
      )
    ).toBeNull();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposedcred
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.initiatordeletedproposedcredential
      )
    ).toBeVisible();
    expect(
      queryByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.accept)
    ).toBeNull();
    expect(
      queryByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.reject)
    ).toBeNull();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.ok)
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    expect(back).toBeCalled();
  });

  test("Initiator opens request after proposing and after threshold is met", async () => {
    const linkedGroup = {
      linkedRequest: {
        accepted: true,
        current: "cred-id",
        previous: undefined,
      },
      threshold: "2",
      members: ["member-1", "member-2"],
      othersJoined: ["member-2"],
      memberInfos: [
        {
          aid: "member-1",
          name: "Member 1",
          joined: true,
        },
        {
          aid: "member-2",
          name: "Member 2",
          joined: true,
        },
      ],
    };

    const storeMocked = {
      ...mockStore({
        ...initialState,
        credsCache: {
          creds: [],
        },
      }),
      dispatch: dispatchMock,
    };

    const back = jest.fn();

    const { getByText, getByTestId, queryByText } = render(
      <Provider store={storeMocked}>
        <CredentialRequestInformation
          pageId="multi-sign"
          activeStatus
          onBack={back}
          onAccept={jest.fn()}
          userAID="member-1"
          notificationDetails={notificationsFix[4]}
          credentialRequest={credRequestFix}
          linkedGroup={linkedGroup}
          onReloadData={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.title
        )
      ).toBeVisible();
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.reachthreshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      queryByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposalfrom
      )
    ).toBeNull();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposedcred
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.initiatordeletedproposedcredential
      )
    ).toBeVisible();
    expect(
      queryByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.accept)
    ).toBeNull();
    expect(
      queryByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.reject)
    ).toBeNull();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.ok)
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    expect(back).toBeCalled();
  });

  test("Member opens request that does not yet have a proposal", async () => {
    const linkedGroup = {
      linkedRequest: {
        accepted: false,
        current: "cred-id",
        previous: undefined,
      },
      threshold: "2",
      members: ["member-1", "member-2"],
      othersJoined: [],
      memberInfos: [
        {
          aid: "member-1",
          name: "Member 1",
          joined: false,
        },
        {
          aid: "member-2",
          name: "Member 2",
          joined: false,
        },
      ],
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const back = jest.fn();

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialRequestInformation
          pageId="multi-sign"
          activeStatus
          onBack={back}
          onAccept={jest.fn()}
          userAID="member-2"
          notificationDetails={notificationsFix[4]}
          credentialRequest={credRequestFix}
          linkedGroup={linkedGroup}
          onReloadData={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.title
        )
      ).toBeVisible();
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.memberwaitingproposal
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.ok)
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    expect(back).toBeCalled();
  });

  test("Member open request and accepts proposal from initiator", async () => {
    const linkedGroup = {
      linkedRequest: {
        accepted: false,
        current: "cred-id",
        previous: undefined,
      },
      threshold: "2",
      members: ["member-1", "member-2"],
      othersJoined: ["member-1"],
      memberInfos: [
        {
          aid: "member-1",
          name: "Member 1",
          joined: true,
        },
        {
          aid: "member-2",
          name: "Member 2",
          joined: false,
        },
      ],
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const back = jest.fn();

    const { getByText, getByTestId, getAllByText, queryByText, unmount } =
      render(
        <Provider store={storeMocked}>
          <CredentialRequestInformation
            pageId="multi-sign"
            activeStatus
            onBack={back}
            onAccept={jest.fn()}
            userAID="member-2"
            notificationDetails={notificationsFix[4]}
            credentialRequest={credRequestFix}
            linkedGroup={linkedGroup}
            onReloadData={jest.fn()}
          />
        </Provider>
      );

    await waitFor(() => {
      expect(
        getAllByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.proposedcred
        ).length
      ).toBeGreaterThan(1);
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.memberreviewcred
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposalfrom
      )
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.accept)
    ).toBeVisible();

    expect(getByTestId("decline-button-multi-sign")).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193515");

    await waitFor(() => {
      expect(joinMultisigOfferMock).toBeCalled();
    });

    act(() => {
      fireEvent.click(getByTestId("decline-button-multi-sign"));
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.alert.textdecline
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId("multisig-request-alert-decline-confirm-button")
      );
    });

    await waitFor(() => {
      expect(
        queryByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.alert.textdecline
        )
      ).toBeNull();
    });

    await waitFor(() => {
      expect(deleteNotificationMock).toBeCalled();
    });

    unmount();
    document.getElementsByTagName("body")[0].innerHTML = "";
  });

  test("Member open request and accepts proposal from initiator, even if proposed credential is archived", async () => {
    const linkedGroup = {
      linkedRequest: {
        accepted: false,
        current: "cred-id",
        previous: undefined,
      },
      threshold: "2",
      members: ["member-1", "member-2"],
      othersJoined: ["member-1"],
      memberInfos: [
        {
          aid: "member-1",
          name: "Member 1",
          joined: true,
        },
        {
          aid: "member-2",
          name: "Member 2",
          joined: false,
        },
      ],
    };

    const storeMocked = {
      ...mockStore({
        ...initialState,
        credsCache: {
          creds: [],
        },
        credsArchivedCache: {
          creds: [{ ...credsFixAcdc[0], id: "cred-id" }],
        },
      }),
      dispatch: dispatchMock,
    };

    const back = jest.fn();

    const { getByText, getByTestId, getAllByText, queryByText, unmount } =
      render(
        <Provider store={storeMocked}>
          <CredentialRequestInformation
            pageId="multi-sign"
            activeStatus
            onBack={back}
            onAccept={jest.fn()}
            userAID="member-2"
            notificationDetails={notificationsFix[4]}
            credentialRequest={credRequestFix}
            linkedGroup={linkedGroup}
            onReloadData={jest.fn()}
          />
        </Provider>
      );

    await waitFor(() => {
      expect(
        getAllByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.proposedcred
        ).length
      ).toBeGreaterThan(1);
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.memberreviewcred
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposalfrom
      )
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.accept)
    ).toBeVisible();

    expect(getByTestId("decline-button-multi-sign")).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193515");

    await waitFor(() => {
      expect(joinMultisigOfferMock).toBeCalled();
    });

    act(() => {
      fireEvent.click(getByTestId("decline-button-multi-sign"));
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.alert.textdecline
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId("multisig-request-alert-decline-confirm-button")
      );
    });

    await waitFor(() => {
      expect(
        queryByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.alert.textdecline
        )
      ).toBeNull();
    });

    await waitFor(() => {
      expect(deleteNotificationMock).toBeCalled();
    });

    unmount();
    document.getElementsByTagName("body")[0].innerHTML = "";
  });

  test("Member opens request after already accepting but before reaching threshold", async () => {
    const linkedGroup = {
      linkedRequest: {
        accepted: true,
        current: "cred-id",
        previous: undefined,
      },
      threshold: "3",
      members: ["member-1", "member-2", "member-3"],
      othersJoined: ["member-1"],
      memberInfos: [
        {
          aid: "member-1",
          name: "Member 1",
          joined: true,
        },
        {
          aid: "member-2",
          name: "Member 2",
          joined: true,
        },
        {
          aid: "member-3",
          name: "Member 3",
          joined: false,
        },
      ],
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const back = jest.fn();

    const { getByText, getAllByText, getByTestId, queryByTestId, unmount } =
      render(
        <Provider store={storeMocked}>
          <CredentialRequestInformation
            pageId="multi-sign"
            activeStatus
            onBack={back}
            onAccept={jest.fn()}
            userAID="member-2"
            notificationDetails={notificationsFix[4]}
            credentialRequest={credRequestFix}
            linkedGroup={linkedGroup}
            onReloadData={jest.fn()}
          />
        </Provider>
      );

    await waitFor(() => {
      expect(
        getAllByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.proposedcred
        ).length
      ).toBeGreaterThan(1);
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.memberjoined
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposalfrom
      )
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.ok)
    ).toBeVisible();

    expect(
      queryByTestId("secondary-button-multi-sign")
    ).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    expect(back).toBeCalled();

    unmount();
    document.getElementsByTagName("body")[0].innerHTML = "";
  });

  test("Member opens request after already accepting and reaching threshold", async () => {
    const linkedGroup = {
      linkedRequest: {
        accepted: true,
        current: "cred-id",
        previous: undefined,
      },
      threshold: "2",
      members: ["member-1", "member-2", "member-3"],
      othersJoined: ["member-1"],
      memberInfos: [
        {
          aid: "member-1",
          name: "Member 1",
          joined: true,
        },
        {
          aid: "member-2",
          name: "Member 2",
          joined: true,
        },
        {
          aid: "member-3",
          name: "Member 3",
          joined: false,
        },
      ],
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const back = jest.fn();

    const { getByText, getAllByText, getByTestId, queryByTestId, unmount } =
      render(
        <Provider store={storeMocked}>
          <CredentialRequestInformation
            pageId="multi-sign"
            activeStatus
            onBack={back}
            onAccept={jest.fn()}
            userAID="member-2"
            notificationDetails={notificationsFix[4]}
            credentialRequest={credRequestFix}
            linkedGroup={linkedGroup}
            onReloadData={jest.fn()}
          />
        </Provider>
      );

    await waitFor(() => {
      expect(
        getAllByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.proposedcred
        ).length
      ).toBeGreaterThan(1);
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.reachthreshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposalfrom
      )
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.ok)
    ).toBeVisible();

    expect(
      queryByTestId("secondary-button-multi-sign")
    ).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    expect(back).toBeCalled();

    unmount();
    document.getElementsByTagName("body")[0].innerHTML = "";
  });

  test("Member opens request before accepting but threshold has already been reached", async () => {
    const linkedGroup = {
      linkedRequest: {
        accepted: false,
        current: "cred-id",
        previous: undefined,
      },
      threshold: "2",
      members: ["member-1", "member-2", "member-3"],
      othersJoined: ["member-1", "member-3"],
      memberInfos: [
        {
          aid: "member-1",
          name: "Member 1",
          joined: true,
        },
        {
          aid: "member-2",
          name: "Member 2",
          joined: false,
        },
        {
          aid: "member-3",
          name: "Member 3",
          joined: true,
        },
      ],
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const back = jest.fn();

    const { getByText, getAllByText, getByTestId, queryByTestId, unmount } =
      render(
        <Provider store={storeMocked}>
          <CredentialRequestInformation
            pageId="multi-sign"
            activeStatus
            onBack={back}
            onAccept={jest.fn()}
            userAID="member-2"
            notificationDetails={notificationsFix[4]}
            credentialRequest={credRequestFix}
            linkedGroup={linkedGroup}
            onReloadData={jest.fn()}
          />
        </Provider>
      );

    await waitFor(() => {
      expect(
        getAllByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.proposedcred
        ).length
      ).toBeGreaterThan(1);
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.reachthreshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposalfrom
      )
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.ok)
    ).toBeVisible();

    expect(
      queryByTestId("secondary-button-multi-sign")
    ).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    expect(back).toBeCalled();

    unmount();
    document.getElementsByTagName("body")[0].innerHTML = "";
  });

  test("Member opens request before accepting but proposed credential is missing, before threshold is met", async () => {
    const linkedGroup = {
      linkedRequest: {
        accepted: false,
        current: "cred-id",
        previous: undefined,
      },
      threshold: "2",
      members: ["member-1", "member-2", "member-3"],
      othersJoined: ["member-1"],
      memberInfos: [
        {
          aid: "member-1",
          name: "Member 1",
          joined: true,
        },
        {
          aid: "member-2",
          name: "Member 2",
          joined: false,
        },
        {
          aid: "member-3",
          name: "Member 3",
          joined: false,
        },
      ],
    };

    const storeMocked = {
      ...mockStore({
        ...initialState,
        credsCache: {
          creds: credsFixAcdc,
        },
      }),
      dispatch: dispatchMock,
    };

    const back = jest.fn();

    const { getByText, getAllByText, getByTestId, queryByTestId, unmount } =
      render(
        <Provider store={storeMocked}>
          <CredentialRequestInformation
            pageId="multi-sign"
            activeStatus
            onBack={back}
            onAccept={jest.fn()}
            userAID="member-2"
            notificationDetails={notificationsFix[4]}
            credentialRequest={credRequestFix}
            linkedGroup={linkedGroup}
            onReloadData={jest.fn()}
          />
        </Provider>
      );

    await waitFor(() => {
      expect(
        getAllByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.proposedcred
        ).length
      ).toBeGreaterThan(1);
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.memberreviewcred
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposalfrom
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.missingproposedcredential
      )
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.ok)
    ).toBeVisible();

    expect(
      queryByTestId("secondary-button-multi-sign")
    ).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    expect(back).toBeCalled();

    unmount();
    document.getElementsByTagName("body")[0].innerHTML = "";
  });

  test("Member opens request before accepting but proposed credential is missing, after threshold met", async () => {
    const linkedGroup = {
      linkedRequest: {
        accepted: false,
        current: "cred-id",
        previous: undefined,
      },
      threshold: "2",
      members: ["member-1", "member-2", "member-3"],
      othersJoined: ["member-1", "member-3"],
      memberInfos: [
        {
          aid: "member-1",
          name: "Member 1",
          joined: true,
        },
        {
          aid: "member-2",
          name: "Member 2",
          joined: false,
        },
        {
          aid: "member-3",
          name: "Member 3",
          joined: true,
        },
      ],
    };

    const storeMocked = {
      ...mockStore({
        ...initialState,
        credsCache: {
          creds: credsFixAcdc,
        },
      }),
      dispatch: dispatchMock,
    };

    const back = jest.fn();

    const { getByText, getAllByText, getByTestId, queryByTestId, unmount } =
      render(
        <Provider store={storeMocked}>
          <CredentialRequestInformation
            pageId="multi-sign"
            activeStatus
            onBack={back}
            onAccept={jest.fn()}
            userAID="member-2"
            notificationDetails={notificationsFix[4]}
            credentialRequest={credRequestFix}
            linkedGroup={linkedGroup}
            onReloadData={jest.fn()}
          />
        </Provider>
      );

    await waitFor(() => {
      expect(
        getAllByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.proposedcred
        ).length
      ).toBeGreaterThan(1);
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.reachthreshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposalfrom
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.missingproposedcredential
      )
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.ok)
    ).toBeVisible();

    expect(
      queryByTestId("secondary-button-multi-sign")
    ).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    expect(back).toBeCalled();

    unmount();
    document.getElementsByTagName("body")[0].innerHTML = "";
  });

  test("Member opens request after accepting but proposed credential is missing, before threshold is met", async () => {
    const linkedGroup = {
      linkedRequest: {
        accepted: true,
        current: "cred-id",
        previous: undefined,
      },
      threshold: "3",
      members: ["member-1", "member-2", "member-3"],
      othersJoined: ["member-1"],
      memberInfos: [
        {
          aid: "member-1",
          name: "Member 1",
          joined: true,
        },
        {
          aid: "member-2",
          name: "Member 2",
          joined: true,
        },
        {
          aid: "member-3",
          name: "Member 3",
          joined: false,
        },
      ],
    };

    const storeMocked = {
      ...mockStore({
        ...initialState,
        credsCache: {
          creds: credsFixAcdc,
        },
      }),
      dispatch: dispatchMock,
    };

    const back = jest.fn();

    const { getByText, getAllByText, getByTestId, queryByTestId, unmount } =
      render(
        <Provider store={storeMocked}>
          <CredentialRequestInformation
            pageId="multi-sign"
            activeStatus
            onBack={back}
            onAccept={jest.fn()}
            userAID="member-2"
            notificationDetails={notificationsFix[4]}
            credentialRequest={credRequestFix}
            linkedGroup={linkedGroup}
            onReloadData={jest.fn()}
          />
        </Provider>
      );

    await waitFor(() => {
      expect(
        getAllByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.proposedcred
        ).length
      ).toBeGreaterThan(1);
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.memberjoined
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposalfrom
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.missingproposedcredential
      )
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.ok)
    ).toBeVisible();

    expect(
      queryByTestId("secondary-button-multi-sign")
    ).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    expect(back).toBeCalled();

    unmount();
    document.getElementsByTagName("body")[0].innerHTML = "";
  });

  test("Member opens request after accepting but proposed credential is missing, after threshold is met", async () => {
    const linkedGroup = {
      linkedRequest: {
        accepted: true,
        current: "cred-id",
        previous: undefined,
      },
      threshold: "2",
      members: ["member-1", "member-2", "member-3"],
      othersJoined: ["member-1"],
      memberInfos: [
        {
          aid: "member-1",
          name: "Member 1",
          joined: true,
        },
        {
          aid: "member-2",
          name: "Member 2",
          joined: true,
        },
        {
          aid: "member-3",
          name: "Member 3",
          joined: false,
        },
      ],
    };

    const storeMocked = {
      ...mockStore({
        ...initialState,
        credsCache: {
          creds: credsFixAcdc,
        },
      }),
      dispatch: dispatchMock,
    };

    const back = jest.fn();

    const { getByText, getAllByText, getByTestId, queryByTestId, unmount } =
      render(
        <Provider store={storeMocked}>
          <CredentialRequestInformation
            pageId="multi-sign"
            activeStatus
            onBack={back}
            onAccept={jest.fn()}
            userAID="member-2"
            notificationDetails={notificationsFix[4]}
            credentialRequest={credRequestFix}
            linkedGroup={linkedGroup}
            onReloadData={jest.fn()}
          />
        </Provider>
      );

    await waitFor(() => {
      expect(
        getAllByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.proposedcred
        ).length
      ).toBeGreaterThan(1);
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.reachthreshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.proposalfrom
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.missingproposedcredential
      )
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.ok)
    ).toBeVisible();

    expect(
      queryByTestId("secondary-button-multi-sign")
    ).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    expect(back).toBeCalled();

    unmount();
    document.getElementsByTagName("body")[0].innerHTML = "";
  });

  test("Open proposed cred", async () => {
    const linkedGroup = {
      linkedRequest: {
        accepted: true,
        current: "EKfweht5lOkjaguB5dz42BMkfejhBFIF9-ghumzCJ6nv",
        previous: undefined,
      },
      threshold: "2",
      members: ["member-1", "member-2", "member-3"],
      othersJoined: ["member-1"],
      memberInfos: [
        {
          aid: "member-1",
          name: "Member 1",
          joined: true,
        },
        {
          aid: "member-2",
          name: "Member 2",
          joined: true,
        },
        {
          aid: "member-3",
          name: "Member 3",
          joined: false,
        },
      ],
    };

    const storeMocked = {
      ...mockStore({
        ...initialState,
        credsCache: {
          creds: [{ ...credsFixAcdc[0], id: "cred-id" }],
        },
      }),
      dispatch: dispatchMock,
    };

    const back = jest.fn();

    const { getByTestId, getByText, queryByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialRequestInformation
          pageId="multi-sign"
          activeStatus
          onBack={back}
          onAccept={jest.fn()}
          userAID="member-2"
          notificationDetails={notificationsFix[4]}
          credentialRequest={credRequestFix}
          linkedGroup={linkedGroup}
          onReloadData={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getOfferedCredentialSaid).toBeCalled();
    });

    expect(getByTestId("proposed-cred-card")).toBeVisible();

    fireEvent.click(getByTestId("proposed-cred-card"));

    await waitFor(() => {
      expect(getByTestId("request-cred-detail-modal")).toBeVisible();
    });

    fireEvent.click(getByText(EN_TRANSLATIONS.tabs.credentials.details.done));

    await waitFor(() => {
      expect(queryByTestId("request-cred-detail-modal")).toBeNull();
    });
  });
});
