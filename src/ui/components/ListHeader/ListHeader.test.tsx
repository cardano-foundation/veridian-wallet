import { render } from "@testing-library/react";
import { ListHeader } from "./ListHeader";

describe("List Header", () => {
  test("Render back button", async () => {
    const { getByTestId, getByText } = render(
      <ListHeader
        title="title"
        hasAction
      />
    );

    expect(getByText("title")).toBeVisible();
    expect(getByTestId("list-header-first-icon")).toBeVisible();
    expect(getByTestId("list-header-second-icon")).toBeVisible();
  });
});
