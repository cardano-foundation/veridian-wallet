import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { Route } from "react-router-dom";
import { IonReactRouter } from "@ionic/react-router";
import { CLEAR_STATE_DELAY, CardsStack, NAVIGATION_DELAY } from "./CardsStack";
import { identifierFix } from "../../__fixtures__/identifierFix";
import { store } from "../../../store";
import { IdentifierDetails } from "../../pages/IdentifierDetails";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { CardType } from "../../globals/types";
import { CredentialDetails } from "../../pages/CredentialDetails";
import { CredentialStatus } from "../../../core/agent/services/credentialService.types";
import { filteredCredsFix } from "../../__fixtures__/filteredCredsFix";

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      identifiers: {
        getIdentifier: jest.fn().mockResolvedValue({
          id: "did:key:z6MkpNyGdCf5cy1S9gbLD1857YK5Ey1pnQoZxVeeGifA1ZQv",
          displayName: "Anonymous ID",
          createdAtUTC: "2023-01-01T19:23:24Z",
          theme: 0,
          keyType: "Ed25519",
          controller:
            "did:key:z6MkpNyGdCf5cy1S9gbLD1857YK5Ey1pnQoZxVeeGifA1ZQv",
          publicKeyBase58: "AviE3J4duRXM6AEvHSUJqVnDBYoGNXZDGUjiSSh96LdY",
        }),
      },
      credentials: {
        getCredentialDetailsById: jest.fn().mockResolvedValue({
          id: "EKfweht5lOkjaguB5dz42BMkfejhBFIF9-ghumzCJ6nv",
          status: "confirmed",
          i: "EGvs2tol4NEtRvYFQDwzRJNnxZgAiGbM4iHB3h4gpRN5",
          a: {
            d: "EJ3HSnEqtSm3WiucWkeBbKspmEAIjf2N6wr5EKOcQ9Vl",
            i: "EJWgO4hwKxNMxu2aUpmGFMozKt9Eq2Jz8n-xXR7CYtY_",
            dt: "2024-01-22T16:03:44.643000+00:00",
            LEI: "5493001KJTIIGC8Y1R17",
          },
          s: {
            title: "Qualified vLEI Issuer Credential",
            description:
              "A vLEI Credential issued by GLEIF to Qualified vLEI Issuers which allows the Qualified vLEI Issuers to issue, verify and revoke Legal Entity vLEI Credentials and Legal Entity Official Organizational Role vLEI Credentials",
            version: "1.0.0",
          },
          lastStatus: {
            s: "0",
            dt: "2024-01-22T16:05:44.643Z",
          },
        }),
      },
      basicStorage: {
        deleteById: jest.fn(),
      },
      connections: {
        getConnectionShortDetailById: jest.fn(),
      },
    },
  },
}));

describe("Cards Stack Component", () => {
  test("It renders Cards Stack", () => {
    const { getByText } = render(
      <Provider store={store}>
        <CardsStack
          name="example"
          cardsType={CardType.IDENTIFIERS}
          cardsData={identifierFix}
        />
      </Provider>
    );
    const firstCardId = getByText(
      identifierFix[0].id.substring(0, 5) +
        "..." +
        identifierFix[0].id.slice(-5)
    );
    expect(firstCardId).toBeInTheDocument();
  });

  test("It renders on Credential card with card pending", () => {
    const { getByText } = render(
      <Provider store={store}>
        <CardsStack
          name="example"
          cardsType={CardType.CREDENTIALS}
          cardsData={[
            {
              ...filteredCredsFix[0],
              status: CredentialStatus.PENDING,
            },
          ]}
        />
      </Provider>
    );
    const labelPending = getByText(CredentialStatus.PENDING);
    expect(labelPending).toBeInTheDocument();
  });

  test("It navigates to Identifier Details and back", async () => {
    jest.useFakeTimers();
    const { findByTestId } = render(
      <IonReactRouter>
        <Provider store={store}>
          <CardsStack
            name="example"
            cardsType={CardType.IDENTIFIERS}
            cardsData={identifierFix}
          />
          <Route
            path={TabsRoutePath.IDENTIFIER_DETAILS}
            component={IdentifierDetails}
          />
        </Provider>
      </IonReactRouter>
    );

    const firstCard = await findByTestId(
      "identifier-card-template-example-index-0"
    );
    await waitFor(() => expect(firstCard).not.toHaveClass("active"));

    act(() => {
      fireEvent.click(firstCard);
      jest.advanceTimersByTime(NAVIGATION_DELAY);
    });

    await waitFor(() => expect(firstCard).toHaveClass("active"));

    const doneButton = await findByTestId("close-button");
    act(() => {
      fireEvent.click(doneButton);
      jest.advanceTimersByTime(CLEAR_STATE_DELAY);
    });

    await waitFor(() => expect(firstCard).not.toHaveClass("active"));
  });

  test("It navigates to Credential Details", async () => {
    jest.useFakeTimers();
    const { findByTestId } = render(
      <IonReactRouter>
        <Provider store={store}>
          <CardsStack
            name="example"
            cardsType={CardType.CREDENTIALS}
            cardsData={filteredCredsFix}
          />
          <Route
            path={TabsRoutePath.CREDENTIAL_DETAILS}
            component={CredentialDetails}
          />
        </Provider>
      </IonReactRouter>
    );

    const firstCard = await findByTestId("keri-card-template-example-index-0");
    await waitFor(() => expect(firstCard).not.toHaveClass("active"));

    act(() => {
      fireEvent.click(firstCard);
      jest.advanceTimersByTime(NAVIGATION_DELAY);
    });

    await waitFor(() => expect(firstCard).toHaveClass("active"));
  });
});
