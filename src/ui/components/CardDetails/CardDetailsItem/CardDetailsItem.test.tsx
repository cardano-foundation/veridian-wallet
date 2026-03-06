jest.mock("../../../utils/clipboard", () => ({
  writeToClipboard: jest.fn(),
}));
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import { keyOutline } from "ionicons/icons";
import { Provider } from "react-redux";
import { writeToClipboard } from "../../../utils/clipboard";
import { TabsRoutePath } from "../../../../routes/paths";
import { makeTestStore } from "../../../utils/makeTestStore";
import { CardDetailsItem } from "./CardDetailsItem";

const dispatchMock = jest.fn();
const initialState = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: true,
    },
  },
};

const storeMocked = {
  ...makeTestStore(initialState),
  dispatch: jest.fn(),
};

describe("Card detail item", () => {
  test("copy button calls clipboard API", async () => {
    (writeToClipboard as jest.Mock).mockClear();
    const { findByTestId } = render(
      <Provider store={storeMocked}>
        <CardDetailsItem
          testId="card-test-id"
          info="Copy this text"
          copyButton
          copyContent="Copy this text"
        />
      </Provider>
    );
    const copyButton = await findByTestId("card-test-id-copy-button");
    expect(copyButton).toBeEnabled();
    await userEvent.click(copyButton);
    expect(writeToClipboard).toHaveBeenCalledWith("Copy this text");
  });
  test("Card details render", async () => {
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <CardDetailsItem
          testId="card-test-id"
          info="Test card detail"
          copyButton
          keyValue="Key:"
        />
      </Provider>
    );

    expect(getByTestId("card-test-id-text-value")).toBeVisible();

    expect(getByText("Key:")).toBeVisible();
    expect(getByTestId("card-test-id-copy-button")).not.toBe(null);
  });
  test("Card details render icon", async () => {
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <CardDetailsItem
          testId="card-test-id"
          icon={keyOutline}
          info="Test card detail"
        />
      </Provider>
    );

    expect(getByTestId("card-test-id")).toBeVisible();
    const container = getByTestId("card-test-id");
    expect(container.querySelector(".card-details-info-block-key")).toBe(null);
    expect(container.querySelector(".copy-button")).toBe(null);
    expect(
      container.querySelector(".card-details-info-block-line-start-icon")
    ).not.toBe(null);
  });
});
