import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import { CLEAR_STATE_DELAY, CardsStack, NAVIGATION_DELAY } from "./CardsStack";
import { didsFix } from "../../__fixtures__/didsFix";
import { store } from "../../../store";
import { DidCardDetails } from "../../pages/DidCardDetails";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { credsFix } from "../../__fixtures__/credsFix";
import { CredCardDetails } from "../../pages/CredCardDetails";
import { cardTypes } from "../../__fixtures__/dictionary";
jest.mock("../../../core/aries/ariesAgent", () => ({
  AriesAgent: {
    agent: {
      getIdentity: jest.fn().mockResolvedValue(didsFix[0]),
    },
  },
}));
describe("Cards Stack Component", () => {
  test("It renders Cards Stack", () => {
    const { getByText } = render(
      <Provider store={store}>
        <CardsStack
          cardsType={cardTypes.dids}
          cardsData={didsFix}
        />
      </Provider>
    );
    const firstCardId = getByText(didsFix[0].id);
    expect(firstCardId).toBeInTheDocument();
  });

  test("It renders correct shadow on Did card", () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <CardsStack
          cardsType={cardTypes.dids}
          cardsData={didsFix}
        />
      </Provider>
    );
    const firstCard = getByTestId("did-card-stack-index-0");
    expect(firstCard).toHaveClass("bottom-shadow");
    const secondCard = getByTestId("did-card-stack-index-1");
    expect(secondCard).toHaveClass("top-shadow");
  });

  test("It renders correct shadow on Cred card", () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <CardsStack
          cardsType={cardTypes.creds}
          cardsData={credsFix}
        />
      </Provider>
    );
    const firstCard = getByTestId("cred-card-stack-index-0");
    expect(firstCard).toHaveClass("bottom-shadow");
    const secondCard = getByTestId("cred-card-stack-index-1");
    expect(secondCard).toHaveClass("top-shadow");
  });

  test("It navigates to Did Card Details and back", async () => {
    jest.useFakeTimers();
    const { findByTestId } = render(
      <MemoryRouter>
        <Provider store={store}>
          <CardsStack
            cardsType={cardTypes.dids}
            cardsData={didsFix}
          />
          <Route
            path={TabsRoutePath.DID_DETAILS}
            component={DidCardDetails}
          />
        </Provider>
      </MemoryRouter>
    );

    const firstCard = await findByTestId("did-card-stack-index-0");
    await waitFor(() => expect(firstCard).not.toHaveClass("active"));

    act(() => {
      fireEvent.click(firstCard);
      jest.advanceTimersByTime(NAVIGATION_DELAY);
    });

    await waitFor(() => expect(firstCard).toHaveClass("active"));

    const doneButton = await findByTestId("tab-title-done");
    act(() => {
      fireEvent.click(doneButton);
      jest.advanceTimersByTime(CLEAR_STATE_DELAY);
    });

    await waitFor(() => expect(firstCard).not.toHaveClass("active"));
  });

  test("It navigates to Cred Card Details and back", async () => {
    jest.useFakeTimers();
    const { findByTestId } = render(
      <MemoryRouter>
        <Provider store={store}>
          <CardsStack
            cardsType={cardTypes.creds}
            cardsData={credsFix}
          />
          <Route
            path={TabsRoutePath.CRED_DETAILS}
            component={CredCardDetails}
          />
        </Provider>
      </MemoryRouter>
    );

    const firstCard = await findByTestId("cred-card-stack-index-0");
    await waitFor(() => expect(firstCard).not.toHaveClass("active"));

    act(() => {
      fireEvent.click(firstCard);
      jest.advanceTimersByTime(NAVIGATION_DELAY);
    });

    await waitFor(() => expect(firstCard).toHaveClass("active"));

    const doneButton = await findByTestId("tab-title-done");
    act(() => {
      fireEvent.click(doneButton);
      jest.advanceTimersByTime(CLEAR_STATE_DELAY);
    });

    await waitFor(() => expect(firstCard).not.toHaveClass("active"));
  });
});
