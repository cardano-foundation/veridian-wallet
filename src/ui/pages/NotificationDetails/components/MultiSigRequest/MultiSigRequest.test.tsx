const verifySecretMock = jest.fn().mockResolvedValue(true);

import { fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { mockIonicReact } from "@ionic/react-test-utils";
import { act } from "react";
import { TabsRoutePath } from "../../../../../routes/paths";
import { notificationsFix } from "../../../../__fixtures__/notificationsFix";
import {
  connectionsFix,
  connectionsForNotifications,
} from "../../../../__fixtures__/connectionsFix";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { MultiSigRequest } from "./MultiSigRequest";
import { filteredIdentifierFix } from "../../../../__fixtures__/filteredIdentifierFix";
import { setNotificationsCache } from "../../../../../store/reducers/notificationsCache";
import { MultiSigService } from "../../../../../core/agent/services/multiSigService";
import { KeyStoreKeys } from "../../../../../core/storage";
import { passcodeFiller } from "../../../../utils/passcodeFiller";

mockIonicReact();

const multisigIcpDetails = {
  sender: {
    label: "CF Credential Issuance",
  },
  ourIdentifier: {
    theme: 1,
    displayName: "displayName",
  },
  otherConnections: connectionsFix,
};

const deleteNotificationMock = jest.fn((id: string) => Promise.resolve(id));
const getMultiSignMock = jest.fn().mockResolvedValue(multisigIcpDetails);
const joinGroupMock = jest.fn((...params: unknown[]) =>
  Promise.resolve({
    identifier: "identifier-id",
  })
);

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  isPlatform: () => true,
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      keriaNotifications: {
        deleteNotificationRecordById: (id: string) =>
          deleteNotificationMock(id),
      },
      multiSigs: {
        getMultisigIcpDetails: () => getMultiSignMock(),
        joinGroup: (...params: unknown[]) => joinGroupMock(...params),
      },
      auth: {
        verifySecret: verifySecretMock,
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
    isOnline: true,
  },
  connectionsCache: {
    connections: connectionsForNotifications,
  },
  notificationsCache: {
    notifications: notificationsFix,
  },
  biometricsCache: {
    enabled: false,
  },
  identifiersCache: {
    identifiers: filteredIdentifierFix,
  },
};

describe("Multisign request", () => {
  test("Render and decline", async () => {
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <MultiSigRequest
          pageId="multi-sign"
          activeStatus
          handleBack={jest.fn()}
          notificationDetails={notificationsFix[3]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.notifications.details.identifier.title)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("decline-button-multi-sign"));
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.identifier.alert
            .textdecline
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId("multisig-request-alert-decline-confirm-button")
      );
    });

    await waitFor(() => {
      expect(deleteNotificationMock).toBeCalled();
    });
  });

  test("Accept", async () => {
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const backMock = jest.fn();
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <MultiSigRequest
          pageId="multi-sign"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[3]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.notifications.details.identifier.title)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
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
      expect(joinGroupMock).toBeCalledWith(
        notificationsFix[3].id,
        notificationsFix[3].a.d
      );
    });

    const newNotification = notificationsFix.filter(
      (notification) => notification.id !== notificationsFix[3].id
    );

    expect(backMock).toBeCalled();
    expect(dispatchMock).lastCalledWith(setNotificationsCache(newNotification));
  });

  test("Show error page", async () => {
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const backMock = jest.fn();
    getMultiSignMock.mockRejectedValue(
      new Error(MultiSigService.UNKNOWN_AIDS_IN_MULTISIG_ICP)
    );
    const { getByText } = render(
      <Provider store={storeMocked}>
        <MultiSigRequest
          pageId="multi-sign"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[3]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.identifier.errorpage.title
        )
      ).toBeVisible();
    });
  });
});
