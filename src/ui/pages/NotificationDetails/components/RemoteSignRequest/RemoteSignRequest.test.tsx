import { fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../../routes/paths";
import { connectionsForNotifications } from "../../../../__fixtures__/connectionsFix";
import { filteredIdentifierMapFix } from "../../../../__fixtures__/filteredIdentifierFix";
import { notificationsFix } from "../../../../__fixtures__/notificationsFix";
import { passcodeFiller } from "../../../../utils/passcodeFiller";
import { RemoteSignRequest } from "./RemoteSignRequest";

const mockStore = configureStore();
const dispatchMock = jest.fn();

const remoteSignMock = jest.fn();
const getRemoteSignRequestDetailsMock = jest.fn(() => ({
  identifier: "ENuh2aOh3ZpZhvIdz2zJbdpUllatrArTUN8A_-BWxWGc",
  payload: {
    t: 8,
  },
}));

jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      identifiers: {
        remoteSign: () => remoteSignMock(),
        getRemoteSignRequestDetails: () => getRemoteSignRequestDetailsMock(),
      },
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
    },
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

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
  biometricsCache: {
    enabled: false,
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
    const { getAllByText, getByText } = render(
      <Provider store={storeMocked}>
        <RemoteSignRequest
          pageId="creadential-request"
          activeStatus
          handleBack={jest.fn()}
          notificationDetails={notificationsFix[7]}
        />
      </Provider>
    );

    expect(
      getAllByText(
        `${EN_TRANSLATIONS.tabs.notifications.details.sign.title}`
      )[0]
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.sign.identifier)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.sign.info)
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.sign.transaction.data
      )
    ).toBeVisible();
    await waitFor(() => {
      expect(getByText("ENuh2aOh..._-BWxWGc")).toBeVisible();
    });
  });

  test("Sign remote request", async () => {
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <RemoteSignRequest
          pageId="creadential-request"
          activeStatus
          handleBack={jest.fn()}
          notificationDetails={notificationsFix[7]}
        />
      </Provider>
    );
    await waitFor(() => {
      expect(getByText("ENuh2aOh..._-BWxWGc")).toBeVisible();
    });

    fireEvent.click(getByText(EN_TRANSLATIONS.request.button.sign));

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(remoteSignMock).toBeCalled();
    });
  });
});
