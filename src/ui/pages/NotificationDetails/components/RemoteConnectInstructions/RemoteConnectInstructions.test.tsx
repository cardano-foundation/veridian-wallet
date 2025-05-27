import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../../routes/paths";
import { connectionsForNotifications } from "../../../../__fixtures__/connectionsFix";
import { filteredIdentifierMapFix } from "../../../../__fixtures__/filteredIdentifierFix";
import {
  connectInstructionsFix,
  notificationsFix,
} from "../../../../__fixtures__/notificationsFix";
import { RemoteConnectInstructions } from "./RemoteConnectInstructions";

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
  credsCache: {
    creds: [],
  },
  connectionsCache: {
    connections: connectionsForNotifications,
  },
  notificationsCache: {
    notifications: notificationsFix,
  },
  identifiersCache: {
    identifiers: filteredIdentifierMapFix,
  },
};

describe("Receive credential", () => {
  global.ResizeObserver = class {
    observe() {
      jest.fn();
    }
    unobserve() {
      jest.fn();
    }
    disconnect() {
      jest.fn();
    }
  };
  test("Render and decline", async () => {
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const connectionName = "ServerToConnectTo";
    const { getAllByText, getByText } = render(
      <Provider store={storeMocked}>
        <RemoteConnectInstructions
          pageId="creadential-request"
          activeStatus
          handleBack={jest.fn()}
          notificationDetails={connectInstructionsFix}
        />
      </Provider>
    );

    expect(
      getAllByText(
        `${EN_TRANSLATIONS.tabs.notifications.details.connectinstructions.title.replace(
          "{{connection}}",
          connectionName
        )}`
      )[0]
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.connectinstructions.description.replace(
          "{{connection}}",
          connectionName
        )
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.connectinstructions.subtitle.replace(
          "{{connection}}",
          connectionName
        )
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.connectinstructions.steps.one
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.connectinstructions.steps.two.replace(
          "{{connection}}",
          connectionName
        )
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.connectinstructions.steps
          .three
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.connectinstructions.steps
          .four
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.connectinstructions.steps
          .five
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.connectinstructions.steps.six.replace(
          "{{connection}}",
          connectionName
        )
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.connectinstructions.button
          .label
      )
    ).toBeVisible();
  });
});
