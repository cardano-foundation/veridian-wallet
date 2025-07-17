import { fireEvent, render } from "@testing-library/react";
import { arrowBackOutline } from "ionicons/icons";
import { ListHeader } from "./ListHeader";

describe("List Header", () => {
  test("render", async () => {
    const firstIconClick = jest.fn();
    const secondIconClick = jest.fn();

    const { getByTestId, getByText } = render(
      <ListHeader
        title="title"
        hasAction
        firstIcon={arrowBackOutline}
        secondIcon={arrowBackOutline}
        onFirstIconClick={firstIconClick}
        onSecondIconClick={secondIconClick}
      />
    );

    expect(getByText("title")).toBeVisible();
    expect(getByTestId("list-header-first-icon")).toBeVisible();
    expect(getByTestId("list-header-second-icon")).toBeVisible();

    fireEvent.click(getByTestId("list-header-first-icon"));
    expect(firstIconClick).toBeCalled();
    fireEvent.click(getByTestId("list-header-second-icon"));
    expect(secondIconClick).toBeCalled();
  });
});
