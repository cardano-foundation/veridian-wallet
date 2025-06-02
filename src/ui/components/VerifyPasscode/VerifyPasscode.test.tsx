const verifySecretMock = jest.fn();

import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import configureStore from "redux-mock-store";
import { Agent } from "../../../core/agent/agent";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { credsFixAcdc } from "../../__fixtures__/credsFix";
import { TabsRoutePath } from "../../components/navigation/TabsMenu";
import { CredentialDetails } from "../../pages/CredentialDetails";
import { VerifyPasscode } from "./VerifyPasscode";
import { connectionsMapFix } from "../../__fixtures__/connectionsFix";

const path = TabsRoutePath.CREDENTIALS + "/" + credsFixAcdc[0].id;

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    id: credsFixAcdc[0].id,
  }),
  useRouteMatch: () => ({ url: path }),
}));

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      credentials: {
        getCredentialDetailsById: jest.fn(),
      },
      connections: {
        getConnectionShortDetailById: jest.fn(() => Promise.resolve([])),
      },
      auth: {
        verifySecret: verifySecretMock,
      },
    },
  },
}));

const initialStateNoPassword = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: false,
      passwordIsSkipped: true,
    },
    isOnline: true,
  },
  seedPhraseCache: {
    seedPhrase:
      "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
    bran: "bran",
  },
  credsCache: { creds: credsFixAcdc },
  credsArchivedCache: { creds: credsFixAcdc },
  biometricsCache: {
    enabled: false,
  },
  notificationsCache: {
    notificationDetailCache: null,
  },
  identifiersCache: {
    identifiers: {},
  },
  connectionsCache: {
    connections: connectionsMapFix,
  },
};

describe("Verify Passcode on Cards Details page", () => {
  let storeMocked: Store<unknown, AnyAction>;
  beforeEach(() => {
    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    storeMocked = {
      ...mockStore(initialStateNoPassword),
      dispatch: dispatchMock,
    };
  });

  test("Render passcode", async () => {
    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    storeMocked = {
      ...mockStore(initialStateNoPassword),
      dispatch: dispatchMock,
    };

    const closeFn = jest.fn();

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <VerifyPasscode
          isOpen={true}
          setIsOpen={closeFn}
          onVerify={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("close-button-label")).toBeInTheDocument();
    });
  });

  test("It renders verify passcode when clicking on the big button", async () => {
    jest
      .spyOn(Agent.agent.credentials, "getCredentialDetailsById")
      .mockResolvedValue(credsFixAcdc[0]);
    const { findByTestId, getAllByText, getAllByTestId, findByText } = render(
      <Provider store={storeMocked}>
        <MemoryRouter initialEntries={[path]}>
          <Route
            path={path}
            component={CredentialDetails}
          />
        </MemoryRouter>
      </Provider>
    );

    const archiveButton = await findByTestId(
      "archive-button-credential-card-details"
    );

    act(() => {
      fireEvent.click(archiveButton);
    });

    await waitFor(async () => {
      const text = await findByText(
        EN_TRANSLATIONS.tabs.credentials.details.alert.archive.title
      );

      expect(text).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getAllByText(
          EN_TRANSLATIONS.tabs.credentials.details.alert.archive.confirm
        )[0]
      );
    });

    await waitFor(() => {
      expect(getAllByTestId("verify-passcode")[0]).toHaveAttribute(
        "is-open",
        "true"
      );
    });
  });
});
