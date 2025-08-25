import { render } from "@testing-library/react";
import { Provider } from "react-redux";

import { mockIonicReact } from "@ionic/react-test-utils";
import { TabsRoutePath } from "../../../../routes/paths";
import { notificationsFix } from "../../../__fixtures__/notificationsFix";
import { connectionsForNotifications } from "../../../__fixtures__/connectionsFix";
import { profileCacheFixData } from "../../../__fixtures__/storeDataFix";
import { EarlierNotification } from "./EarlierNotification";
import EN_TRANSLATIONS from "../../../../locales/en/en.json";
import { makeTestStore } from "../../../utils/makeTestStore";

mockIonicReact();

jest.mock("../../../../core/configuration", () => ({
  ...jest.requireActual("../../../../core/configuration"),
  ConfigurationService: {
    env: {
      features: {
        notifications: {
          fallbackIcon: false,
        },
      },
    },
  },
}));

jest.mock("../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      multiSigs: {
        getMultisigIcpDetails: jest.fn().mockResolvedValue({
          sender: {
            label: "CF Credential Issuance",
          },
        }),
      },
    },
  },
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
    profiles: {
      ...profileCacheFixData.profiles,
      ...(profileCacheFixData.defaultProfile
        ? {
            [profileCacheFixData.defaultProfile as string]: {
              ...profileCacheFixData.profiles[
                profileCacheFixData.defaultProfile as string
              ],
              connections: Object.values(connectionsForNotifications),
            },
          }
        : {}),
    },
  },
};

describe("Earlier notifications", () => {
  test("render", () => {
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <EarlierNotification
          pageId="notification-page"
          onNotificationClick={jest.fn()}
          data={notificationsFix}
          onOpenOptionModal={jest.fn()}
        />
      </Provider>
    );

    expect(getByTestId("show-earlier-btn")).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.tab.sections.earlier.title)
    ).toBeVisible();
  });
});
