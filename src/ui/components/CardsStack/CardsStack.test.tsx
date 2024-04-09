import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import { IonReactRouter } from "@ionic/react-router";
import { CLEAR_STATE_DELAY, CardsStack, NAVIGATION_DELAY } from "./CardsStack";
import { identifierFix } from "../../__fixtures__/identifierFix";
import { store } from "../../../store";
import { IdentifierDetails } from "../../pages/IdentifierDetails";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { credsFixAcdc } from "../../__fixtures__/credsFix";
import { CredentialMetadataRecordStatus } from "../../../core/agent/records/credentialMetadataRecord.types";
import { CardType } from "../../globals/types";

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      identifiers: {
        getIdentifier: jest.fn().mockResolvedValue({
          id: "did:key:z6MkpNyGdCf5cy1S9gbLD1857YK5Ey1pnQoZxVeeGifA1ZQv",
          displayName: "Anonymous ID",
          createdAtUTC: "2023-01-01T19:23:24Z",
          colors: ["#92FFC0", "#47FF94"],
          theme: 0,
          keyType: "Ed25519",
          controller:
            "did:key:z6MkpNyGdCf5cy1S9gbLD1857YK5Ey1pnQoZxVeeGifA1ZQv",
          publicKeyBase58: "AviE3J4duRXM6AEvHSUJqVnDBYoGNXZDGUjiSSh96LdY",
        }),
        checkMultisigComplete: jest.fn().mockResolvedValue(true),
      },
      credentials: {
        getCredentialDetailsById: jest.fn().mockResolvedValue({}),
      },
      genericRecords: {
        findById: jest.fn(),
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

  test("It renders on Cred card with card pending", () => {
    const { getByText } = render(
      <Provider store={store}>
        <CardsStack
          name="example"
          cardsType={CardType.CREDS}
          cardsData={[
            {
              ...credsFixAcdc[0],
              status: CredentialMetadataRecordStatus.PENDING,
            },
          ]}
        />
      </Provider>
    );
    const labelPending = getByText(CredentialMetadataRecordStatus.PENDING);
    expect(labelPending).toBeInTheDocument();
  });

  test("It navigates to Identifier Card Details and back", async () => {
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

  // test("It navigates to Cred Card Details and back", async () => {
  //   jest.useFakeTimers();
  //   jest
  //     .spyOn(Agent.agent.credentials, "getCredentialDetailsById")
  //     .mockResolvedValue(credsFixW3c[0]);
  //   const { findByTestId } = render(
  //     <MemoryRouter>
  //       <Provider store={store}>
  //         <CardsStack
  //           name="example"
  //           cardsType={CardType.CREDS}
  //           cardsData={credsFixW3c}
  //         />
  //         <Route
  //           path={TabsRoutePath.CRED_DETAILS}
  //           component={CredentialCardDetails}
  //         />
  //       </Provider>
  //     </MemoryRouter>
  //   );

  //   const firstCard = await findByTestId("cred-card-template-example-index-0");
  //   await waitFor(() => expect(firstCard).not.toHaveClass("active"));

  //   act(() => {
  //     fireEvent.click(firstCard);
  //     jest.advanceTimersByTime(NAVIGATION_DELAY);
  //   });

  //   await waitFor(() => expect(firstCard).toHaveClass("active"));

  //   const doneButton = await findByTestId("tab-done-button");
  //   act(() => {
  //     fireEvent.click(doneButton);
  //     jest.advanceTimersByTime(CLEAR_STATE_DELAY);
  //   });

  //   await waitFor(() => expect(firstCard).not.toHaveClass("active"));
  // });
});
