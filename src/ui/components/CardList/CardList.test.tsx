import { fireEvent, render } from "@testing-library/react";
import { act } from "react";
import { CardList } from "./CardList";
import { walletConnectionsFix } from "../../__fixtures__/walletConnectionsFix";

const displayConnection = walletConnectionsFix.map((connection, index) => ({
  id: connection.meerkatId,
  title: connection.name,
  subtitle: index % 2 === 0 ? connection.selectedAid : undefined,
  image: index % 2 === 0 ? "mock-image-link" : undefined,
  data: connection,
}));

describe("Card list", () => {
  test("Card list render", async () => {
    const cardClickFn = jest.fn();

    const { getByTestId, queryByTestId, getAllByText, getAllByTestId } = render(
      <CardList
        data={[displayConnection[0]] as any}
        onCardClick={cardClickFn}
        onRenderCardAction={() => <button>Mock Action</button>}
        onRenderEndSlot={() => <span>End slot</span>}
      />
    );

    const hasOwnerConnection = displayConnection[0];

    expect(getByTestId("card-title-" + hasOwnerConnection.id).innerHTML).toBe(
      hasOwnerConnection.title
    );
    expect(
      getByTestId("card-subtitle-" + hasOwnerConnection.id).innerHTML
    ).toBe(hasOwnerConnection.subtitle);

    expect(getAllByTestId("card-actions").length).toBe(1);
    expect(getAllByTestId("card-actions")[0]).toBeInTheDocument();
    expect(getAllByText("End slot").length).toBe(1);

    expect(queryByTestId("card-logo")).toBeVisible();
    expect(queryByTestId("card-fallback-logo")).toBe(null);
  });
  test("Card list not render action", async () => {
    const cardClickFn = jest.fn();

    const { queryByTestId, getByTestId } = render(
      <CardList
        data={[displayConnection[1] as any]}
        onCardClick={cardClickFn}
      />
    );

    const emptyOwnerConnection = displayConnection[1];

    expect(getByTestId("card-title-" + emptyOwnerConnection.id).innerHTML).toBe(
      emptyOwnerConnection.title
    );
    expect(queryByTestId("card-subtitle-" + emptyOwnerConnection.id)).toBe(
      null
    );

    expect(queryByTestId("card-logo")).toBe(null);
    expect(queryByTestId("card-fallback-logo")).toBeVisible();

    expect(queryByTestId("End slot")).toBe(null);
    expect(queryByTestId("End slot")).toBe(null);

    act(() => {
      fireEvent.click(getByTestId("card-title-" + emptyOwnerConnection.id));
    });

    expect(cardClickFn).toBeCalledTimes(1);
  });
});
