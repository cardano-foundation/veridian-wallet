import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { ReadMore } from "./ReadMore";

describe("ReadMore", () => {
  beforeEach(() => {
    window.getComputedStyle = jest.fn().mockReturnValue({ lineHeight: "20px" });

    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        return this.dataset.testid === "read-more-text" ? 60 : 0;
      },
    });
  });

  test("View text when expand and collapse", async () => {
    const text =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
    const { getByTestId } = render(<ReadMore content={text} />);

    expect(getByTestId("read-more-text").innerHTML).toBe(text);
    await waitFor(() => {
      expect(getByTestId("read-more-button")).toBeVisible();
    });

    expect(getByTestId("read-more-button").innerHTML).toBe(
      EN_TRANSLATIONS.readmore.more
    );

    act(() => {
      fireEvent.click(getByTestId("read-more-button"));
    });

    await waitFor(() => {
      expect(getByTestId("read-more-button").innerHTML).toBe(
        EN_TRANSLATIONS.readmore.less
      );
    });
    act(() => {
      fireEvent.click(getByTestId("read-more-button"));
    });
    await waitFor(() => {
      expect(getByTestId("read-more-button").innerHTML).toBe(
        EN_TRANSLATIONS.readmore.more
      );
    });
  });
});
