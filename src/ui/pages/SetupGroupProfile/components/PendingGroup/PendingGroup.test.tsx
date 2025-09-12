import { IonReactMemoryRouter } from "@ionic/react-router";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { RoutePath } from "../../../../../routes/paths";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { connectionsFix } from "../../../../__fixtures__/connectionsFix";
import { multisignIdentifierFix } from "../../../../__fixtures__/filteredIdentifierFix";
import { ToastMsgType } from "../../../../globals/types";
import { makeTestStore } from "../../../../utils/makeTestStore";
import { passcodeFiller } from "../../../../utils/passcodeFiller";
import { GroupInfomation, Stage } from "../../SetupGroupProfile.types";
import { PendingGroup } from "./PendingGroup";

const markIdentifierPendingDelete = jest.fn();

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

const connectByOobiUrlMock = jest.fn();
jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      identifiers: {
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

describe("Pending group", () => {
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
    },
  };

  let stage1State: GroupInfomation = {
    stage: Stage.SetupConnection,
    displayNameValue: "test",
    signer: {
      recoverySigners: 0,
      requiredSigners: 0,
    },
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

  describe("Initiator", () => {
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
              groupName="Test Group"
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
              groupName="Test Group"
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
});
