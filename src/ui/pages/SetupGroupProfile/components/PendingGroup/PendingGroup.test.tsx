const markIdentifierPendingDelete = jest.fn();
const getMultisigIcpDetailsMock = jest.fn();
const deleteNotificationRecordByIdMock = jest.fn();
const joinGroupMock = jest.fn();

import { IonReactMemoryRouter } from "@ionic/react-router";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import { ConnectionShortDetails } from "../../../../../core/agent/agent.types";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { RoutePath } from "../../../../../routes/paths";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { multisignConnection } from "../../../../__fixtures__/connectionsFix";
import { multisignIdentifierFix } from "../../../../__fixtures__/filteredIdentifierFix";
import { ToastMsgType } from "../../../../globals/types";
import { makeTestStore } from "../../../../utils/makeTestStore";
import { passcodeFiller } from "../../../../utils/passcodeFiller";
import { GroupInfomation, Stage } from "../../SetupGroupProfile.types";
import { PendingGroup } from "./PendingGroup";
import { notificationsFix } from "../../../../__fixtures__/notificationsFix";

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
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

jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      identifiers: {
        markIdentifierPendingDelete: () => markIdentifierPendingDelete(),
      },
      multiSigs: {
        joinGroup: joinGroupMock,
        getMultisigIcpDetails: () => getMultisigIcpDetailsMock(),
        getInceptionStatus: jest.fn(() =>
          Promise.resolve(() => ({
            threshold: {
              signingThreshold: 1,
              rotationThreshold: 2,
            },
            members: [
              {
                aid: "EGpdFYdBkhbMBqTkUGaYeHmu0cX0EgxohGXwY6uLa2d2",
                name: "Leader",
                hasAccepted: false,
              },
            ],
          }))
        ),
      },
      keriaNotifications: {
        deleteNotificationRecordById: () => deleteNotificationRecordByIdMock(),
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
    proposedUsername: "Initiator",
  },
};

const memberGroupProfile = {
  ...multisignIdentifierFix[0],
  groupMetadata: {
    groupId: "549eb79f-856c-4bb7-8dd5-d5eed865906a",
    groupCreated: false,
    groupInitiator: false,
    proposedUsername: "Initiator",
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

describe("Pending group", () => {
  let stage1State: GroupInfomation = {
    stage: Stage.SetupConnection,
    displayNameValue: "test",
    signer: {
      recoverySigners: 0,
      requiredSigners: 0,
    },
    scannedConections: [multisignConnection as ConnectionShortDetails],
    selectedConnections: [multisignConnection as ConnectionShortDetails],
    ourIdentifier: initiatorGroupProfile.id,
    newIdentifier: initiatorGroupProfile,
  };

  const setState = jest.fn((updater: any) => {
    if (typeof updater === "function") {
      stage1State = updater(stage1State);
    } else {
      stage1State = updater;
    }
  });

  describe("Initiator", () => {
    const initialState = {
      stateCache: {
        routes: [RoutePath.GROUP_PROFILE_SETUP],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
          proposedUsername: "Duke",
        },
        isOnline: true,
      },
      profilesCache: {
        profiles: {
          [initiatorGroupProfile.id]: {
            identity: initiatorGroupProfile,
            notifications: [],
          },
        },
        defaultProfile: initiatorGroupProfile.id,
        recentProfiles: [],
      },
    };
    const dispatchMock = jest.fn();
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };
    test("Render screen", async () => {
      const history = createMemoryHistory();
      history.push(
        RoutePath.GROUP_PROFILE_SETUP.replace(
          ":id",
          multisignIdentifierFix[0].id
        )
      );

      const { getByText } = render(
        <Provider store={storeMocked}>
          <IonReactMemoryRouter history={history}>
            <PendingGroup
              state={stage1State}
              setState={setState}
            />
          </IonReactMemoryRouter>
        </Provider>
      );

      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.leave.button)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.alert.initiatortext)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.groupinfor)
      ).toBeVisible();

      expect(
        getByText(
          EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.recoverysigners
        )
      ).toBeVisible();

      expect(
        getByText(
          EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.requiredsigners
        )
      ).toBeVisible();

      await waitFor(() => {
        expect(getByText(multisignConnection.label)).toBeVisible();
      });
    });

    test("Leave group", async () => {
      const history = createMemoryHistory();
      history.push(
        RoutePath.GROUP_PROFILE_SETUP.replace(
          ":id",
          multisignIdentifierFix[0].id
        )
      );

      const { getByText, getByTestId } = render(
        <Provider store={storeMocked}>
          <IonReactMemoryRouter history={history}>
            <PendingGroup
              state={stage1State}
              setState={setState}
            />
          </IonReactMemoryRouter>
        </Provider>
      );

      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.leave.button)
      ).toBeVisible();

      fireEvent.click(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.leave.button)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.setupgroupprofile.pending.leave.alert.title)
        ).toBeVisible();
      });

      fireEvent.click(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.leave.alert.confirm)
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
  });

  describe("Member", () => {
    const initialState = {
      stateCache: {
        routes: [RoutePath.GROUP_PROFILE_SETUP],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
          proposedUsername: "Duke",
        },
        isOnline: true,
      },
      profilesCache: {
        profiles: {
          [initiatorGroupProfile.id]: {
            identity: memberGroupProfile,
            notifications: [notificationsFix[3]],
          },
        },
        defaultProfile: initiatorGroupProfile.id,
        recentProfiles: [],
      },
    };
    const dispatchMock = jest.fn();
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    beforeEach(() => {
      getMultisigIcpDetailsMock.mockImplementation(() =>
        Promise.resolve({
          ourIdentifier: {
            displayName: "GQPa",
            id: "EM0xtR52dvj6oqDc-guH3SbgTmeo-OfRrZMVA5kRgYWc",
            createdAtUTC: "2025-09-16T10:07:11.363Z",
            theme: 0,
            creationStatus: "COMPLETE",
            groupMetadata: {
              groupId: "0AC8fs5EqOSKRNgjimwxdokY",
              groupInitiator: false,
              groupCreated: false,
              proposedUsername: "QALZ",
              initiatorName: "ALZM",
            },
          },
          sender: {
            id: "EEpyjYUfiB_5FCN_xazDKxzwPRBeSWOoZHzNBUVzyw_A",
            label: "ALZM",
            createdAtUTC: "2025-09-16T10:07:05.654Z",
            status: "pending",
            oobi: "http://keria:3902/oobi/EEpyjYUfiB_5FCN_xazDKxzwPRBeSWOoZHzNBUVzyw_A/agent/EEdFWWRr7iJFTBEc-eBbi4dQsK9mtnbqhK50dnwrup7x?name=ALZM&groupId=0AC8fs5EqOSKRNgjimwxdokY&groupName=GQPa",
            contactId: "EEpyjYUfiB_5FCN_xazDKxzwPRBeSWOoZHzNBUVzyw_A",
            groupId: "0AC8fs5EqOSKRNgjimwxdokY",
          },
          otherConnections: [],
          signingThreshold: 1,
          rotationThreshold: 2,
        })
      );
    });

    test("Render screen", async () => {
      const history = createMemoryHistory();
      history.push(
        RoutePath.GROUP_PROFILE_SETUP.replace(
          ":id",
          multisignIdentifierFix[0].id
        )
      );

      const { getByText } = render(
        <Provider store={storeMocked}>
          <IonReactMemoryRouter history={history}>
            <PendingGroup
              state={stage1State}
              setState={setState}
              isPendingGroup={true}
            />
          </IonReactMemoryRouter>
        </Provider>
      );

      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.leave.button)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.alert.membertext)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.groupinfor)
      ).toBeVisible();

      expect(
        getByText(
          EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.recoverysigners
        )
      ).toBeVisible();

      expect(
        getByText(
          EN_TRANSLATIONS.setupgroupprofile.initgroup.setsigner.requiredsigners
        )
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.button.accept)
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.button.decline)
      ).toBeVisible();

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.setupgroupprofile.pending.request)
        ).toBeVisible();
      });
    });

    test("Decline", async () => {
      const history = createMemoryHistory();
      history.push(
        RoutePath.GROUP_PROFILE_SETUP.replace(
          ":id",
          multisignIdentifierFix[0].id
        )
      );

      const { getByText, getByTestId } = render(
        <Provider store={storeMocked}>
          <IonReactMemoryRouter history={history}>
            <PendingGroup
              state={stage1State}
              setState={setState}
              isPendingGroup
            />
          </IonReactMemoryRouter>
        </Provider>
      );
      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.button.decline)
      ).toBeVisible();

      fireEvent.click(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.button.decline)
      );

      await waitFor(() => {
        expect(
          getByText(
            EN_TRANSLATIONS.setupgroupprofile.pending.decline.alert.title
          )
        ).toBeVisible();
      });

      fireEvent.click(
        getByTestId("multisig-request-alert-decline-confirm-button")
      );

      await waitFor(() => {
        expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
      });

      await passcodeFiller(getByText, getByTestId, "193212");

      await waitFor(() => {
        expect(markIdentifierPendingDelete).toBeCalled();
        expect(deleteNotificationRecordByIdMock).toBeCalled();
        expect(dispatchMock).toBeCalledWith(
          setToastMsg(ToastMsgType.IDENTIFIER_DELETED)
        );
      });
    });

    test("Delete", async () => {
      const history = createMemoryHistory();
      history.push(
        RoutePath.GROUP_PROFILE_SETUP.replace(
          ":id",
          multisignIdentifierFix[0].id
        )
      );

      const { getByText, getByTestId } = render(
        <Provider store={storeMocked}>
          <IonReactMemoryRouter history={history}>
            <PendingGroup
              state={stage1State}
              setState={setState}
              isPendingGroup
            />
          </IonReactMemoryRouter>
        </Provider>
      );
      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.leave.button)
      ).toBeVisible();

      fireEvent.click(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.leave.button)
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.setupgroupprofile.pending.leave.alert.title)
        ).toBeVisible();
      });

      fireEvent.click(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.leave.alert.confirm)
      );

      await waitFor(() => {
        expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
      });

      await passcodeFiller(getByText, getByTestId, "193212");

      await waitFor(() => {
        expect(markIdentifierPendingDelete).toBeCalled();
        expect(deleteNotificationRecordByIdMock).toBeCalled();
        expect(dispatchMock).toBeCalledWith(
          setToastMsg(ToastMsgType.IDENTIFIER_DELETED)
        );
      });
    });

    test("Accept", async () => {
      const history = createMemoryHistory();
      history.push(
        RoutePath.GROUP_PROFILE_SETUP.replace(
          ":id",
          multisignIdentifierFix[0].id
        )
      );

      const { getByText, getByTestId } = render(
        <Provider store={storeMocked}>
          <IonReactMemoryRouter history={history}>
            <PendingGroup
              state={stage1State}
              setState={setState}
              isPendingGroup
            />
          </IonReactMemoryRouter>
        </Provider>
      );

      expect(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.button.accept)
      ).toBeVisible();

      await waitFor(() => {
        expect(getMultisigIcpDetailsMock).toBeCalled();
      });

      fireEvent.click(
        getByText(EN_TRANSLATIONS.setupgroupprofile.pending.button.accept)
      );

      await waitFor(() => {
        expect(joinGroupMock).toBeCalled();
        expect(dispatchMock).toBeCalledWith(
          setToastMsg(ToastMsgType.ACCEPT_SUCCESS)
        );
      });
    });
  });
});
