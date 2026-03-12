import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { store } from "../../../../../store";
import { RomeCardTemplate } from "./RomeCardTemplate";
import { shortCredsFix } from "../../../../__fixtures__/shortCredsFix";
import { formatShortDate } from "../../../../utils/formatters";
import { CredentialStatus } from "../../../../../core/agent/services/credentialService.types";

describe("Rome Card Template", () => {
  it("renders Rome Card Template", async () => {
    const handleShowCardDetails = jest.fn();
    const { getByText, getByTestId, getByAltText } = render(
      <Provider store={store}>
        <RomeCardTemplate
          name="name"
          index={0}
          cardData={shortCredsFix[7]}
          isActive={true}
          onHandleShowCardDetails={() => handleShowCardDetails(0)}
        />
      </Provider>
    );
    const card = getByTestId("rome-card-template-name-index-0");

    expect(
      getByText(formatShortDate(shortCredsFix[7].issuanceDate))
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(card);
    });
    expect(handleShowCardDetails).toBeCalledTimes(1);
  });

  it("Click pending card", async () => {
    const handleShowCardDetails = jest.fn();
    const { getByTestId } = render(
      <Provider store={store}>
        <RomeCardTemplate
          name="name"
          index={0}
          cardData={shortCredsFix[8]}
          isActive={true}
          onHandleShowCardDetails={() => handleShowCardDetails(0)}
        />
      </Provider>
    );
    const card = getByTestId("rome-card-template-name-index-0");

    act(() => {
      fireEvent.click(card);
    });

    expect(handleShowCardDetails).toBeCalledTimes(0);

    await waitFor(() => {
      expect(getByTestId("alert-confirm")).toBeInTheDocument();
    });
  });

  it("In active card status", async () => {
    const handleShowCardDetails = jest.fn();
    const { getByTestId } = render(
      <Provider store={store}>
        <RomeCardTemplate
          name="name"
          index={0}
          cardData={shortCredsFix[8]}
          isActive={false}
          onHandleShowCardDetails={() => handleShowCardDetails(0)}
        />
      </Provider>
    );
    const card = getByTestId("rome-card-template-name-index-0");

    expect(card.classList.contains("active")).toBe(false);
  });

  it("Revoke card status", async () => {
    const handleShowCardDetails = jest.fn();
    const { getByTestId } = render(
      <Provider store={store}>
        <RomeCardTemplate
          name="name"
          index={0}
          cardData={{
            ...shortCredsFix[4],
            status: CredentialStatus.REVOKED,
          }}
          isActive={false}
          onHandleShowCardDetails={() => handleShowCardDetails(0)}
        />
      </Provider>
    );
    const card = getByTestId("rome-card-template-name-index-0");
    expect(card.classList.contains("active")).toBe(false);
    expect(getByTestId("card-issued-date").innerHTML).toBe(
      formatShortDate(shortCredsFix[4].issuanceDate)
    );
  });
});
