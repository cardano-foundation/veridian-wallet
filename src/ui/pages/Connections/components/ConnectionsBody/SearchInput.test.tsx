import { fireEvent, act, render, waitFor } from "@testing-library/react";
import { SearchInput } from "./SearchInput";

describe("Connection search input", () => {
  test("Render", async () => {
    const onFocusChange = jest.fn();

    const { getByTestId } = render(
      <SearchInput
        value="test"
        onInputChange={jest.fn()}
        onFocus={onFocusChange}
      />
    );

    act(() => {
      fireEvent(getByTestId("search-bar"), new CustomEvent("ionFocus"));
    });

    await waitFor(() => {
      expect(onFocusChange).toBeCalledWith(true);
    });
  });

  test("Blur search input", async () => {
    const onFocusChange = jest.fn();

    const { getByTestId } = render(
      <SearchInput
        value=""
        onInputChange={jest.fn()}
        onFocus={onFocusChange}
      />
    );

    act(() => {
      fireEvent(getByTestId("search-bar"), new CustomEvent("ionBlur"));
    });

    await waitFor(() => {
      expect(onFocusChange).toBeCalledWith(false);
    });
  });

  test("Focus search input", async () => {
    const onFocusChange = jest.fn();

    const { getByTestId } = render(
      <SearchInput
        value=""
        onInputChange={jest.fn()}
        onFocus={onFocusChange}
      />
    );

    act(() => {
      fireEvent(getByTestId("search-bar"), new CustomEvent("ionFocus"));
    });

    await waitFor(() => {
      expect(onFocusChange).toBeCalledWith(true);
    });
  });
});
