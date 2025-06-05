import { fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { act } from "react";
import EN_TRANSLATIONS from "../../../../locales/en/en.json";
import { store } from "../../../../store";
import {
  connectionDetailsFix,
  credsFixAcdc,
} from "../../../__fixtures__/credsFix";
import { filteredIdentifierMapFix } from "../../../__fixtures__/filteredIdentifierFix";
import { identifierFix } from "../../../__fixtures__/identifierFix";
import {
  formatShortDate,
  formatTimeToSec,
  getUTCOffset,
} from "../../../utils/formatters";
import { CredentialContent } from "./CredentialContent";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const getIndentifier = jest.fn(() => identifierFix[0]);

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

jest.mock("../../../../core/agent/agent", () => ({
  Agent: {
    MISSING_DATA_ON_KERIA:
      "Attempted to fetch data by ID on KERIA, but was not found. May indicate stale data records in the local database.",
    agent: {
      identifiers: {
        getIdentifier: () => getIndentifier(),
      },
      connections: {
        getOobi: jest.fn(() => Promise.resolve("oobi")),
        getMultisigConnections: jest.fn().mockResolvedValue([]),
      },
    },
  },
}));

describe("Creds content", () => {
  test("Render ACDC cedential content", () => {
    const state = {
      stateCache: {
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: true,
        },
      },
      credsCache: { creds: [], favourites: [] },
      credsArchivedCache: { creds: [] },
      identifiersCache: {
        identifiers: [],
      },
      connectionsCache: {
        multisigConnections: {},
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const mockStore = configureStore();
    const storeMocked = {
      ...mockStore(state),
      dispatch: jest.fn(),
    };

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialContent
          cardData={credsFixAcdc[0]}
          joinedCredRequestMembers={[]}
          connectionShortDetails={connectionDetailsFix}
          setOpenConnectionlModal={jest.fn()}
        />
      </Provider>
    );
    expect(
      getByText(EN_TRANSLATIONS.tabs.credentials.details.about)
    ).toBeVisible();
    expect(getByText(credsFixAcdc[0].s.title)).toBeVisible();
    expect(getByTestId("read-more")).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.credentials.details.attributes.label)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.credentials.details.credentialdetails)
    ).toBeVisible();
    expect(getByTestId("credential-issued-label-text-value").innerHTML).toBe(
      EN_TRANSLATIONS.tabs.credentials.details.status.issued
    );
    expect(getByTestId("credential-issued-section-key-value").innerHTML).toBe(
      formatShortDate(credsFixAcdc[0].a.dt)
    );
    expect(getByTestId("credential-issued-section-text-value").innerHTML).toBe(
      `${formatTimeToSec(credsFixAcdc[0].a.dt)} (${getUTCOffset(
        credsFixAcdc[0].a.dt
      )})`
    );
    expect(
      getByText(EN_TRANSLATIONS.tabs.credentials.details.issuer)
    ).toBeVisible();
    expect(getByText(connectionDetailsFix.label)).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.credentials.details.id)
    ).toBeVisible();
    expect(getByTestId("credential-details-id-text-value").innerHTML).toBe(
      credsFixAcdc[0].id.substring(0, 5) + "..." + credsFixAcdc[0].id.slice(-5)
    );
    expect(
      getByText(EN_TRANSLATIONS.tabs.credentials.details.schemaversion)
    ).toBeVisible();
    expect(getByTestId("credential-details-schema-version").innerHTML).toBe(
      credsFixAcdc[0].s.version
    );
    expect(
      getByTestId("credential-details-last-status-label-text-value").innerHTML
    ).toBe(EN_TRANSLATIONS.tabs.credentials.details.status.label);
    expect(getByTestId("credential-details-last-status").innerHTML).toBe(
      EN_TRANSLATIONS.tabs.credentials.details.status.issued
    );
    const lastStatus = `${
      EN_TRANSLATIONS.tabs.credentials.details.status.timestamp
    } ${formatShortDate(credsFixAcdc[0].lastStatus.dt)} - ${formatTimeToSec(
      credsFixAcdc[0].lastStatus.dt
    )} (${getUTCOffset(credsFixAcdc[0].lastStatus.dt)})`;
    expect(
      getByTestId("credential-details-last-status-timestamp").innerHTML
    ).toBe(lastStatus);
  });

  test("Show missing issuer modal", async () => {
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <CredentialContent
          cardData={credsFixAcdc[0]}
          joinedCredRequestMembers={[]}
          connectionShortDetails={undefined}
          setOpenConnectionlModal={jest.fn()}
        />
      </Provider>
    );

    expect(getByText(EN_TRANSLATIONS.connections.unknown)).toBeVisible();

    fireEvent.click(getByText(EN_TRANSLATIONS.connections.unknown));

    await waitFor(() => {
      expect(getByTestId("cred-missing-issuer-alert")).toBeVisible();
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.credentials.details.alert.missingissuer.text
        )
      ).toBeVisible();
    });
  });

  test("Open related identifier", async () => {
    const state = {
      stateCache: {
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: true,
        },
      },
      credsCache: { creds: credsFixAcdc, favourites: [] },
      credsArchivedCache: { creds: credsFixAcdc },
      identifiersCache: {
        identifiers: filteredIdentifierMapFix,
      },
      connectionsCache: {
        multisigConnections: {
          [connectionDetailsFix.id]: connectionDetailsFix,
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const mockStore = configureStore();
    const storeMocked = {
      ...mockStore(state),
      dispatch: jest.fn(),
    };

    const { getByTestId, getByText, queryByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialContent
          cardData={credsFixAcdc[0]}
          joinedCredRequestMembers={[]}
          connectionShortDetails={connectionDetailsFix}
          setOpenConnectionlModal={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.credentials.details.relatedidentifier)
      ).toBeVisible();
    });

    fireEvent.click(getByTestId("related-identifier-name"));

    await waitFor(() => {
      expect(getByTestId("credential-related-identifier-modal")).toBeVisible();
    });

    await waitFor(() =>
      expect(
        getByTestId("identifier-card-template-default-index-0")
      ).toBeInTheDocument()
    );
    expect(
      queryByTestId("delete-button-credential-related-identifier")
    ).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(getByTestId("identifier-options-button"));
    });

    await waitFor(() => {
      expect(getByTestId("share-identifier-option")).toBeInTheDocument();
    });

    expect(queryByTestId("delete-identifier-option")).not.toBeInTheDocument();
  });
});
