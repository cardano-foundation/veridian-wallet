import { fireEvent, render } from "@testing-library/react";
import { SearchInput } from "./SearchInput";

describe("Search input", () => {
  test("cancel search", async () => {
    const focusMock = jest.fn();
    const { getByTestId } = render(
      <SearchInput
        value=""
        onInputChange={jest.fn()}
        onFocus={focusMock}
      />
    );

    fireEvent(getByTestId("search-bar"), new CustomEvent("ionFocus"));
    expect(focusMock).toBeCalledWith(true);

    fireEvent(getByTestId("search-bar"), new CustomEvent("ionCancel"));
    expect(focusMock).toBeCalledWith(false);
  });

  test("focus", async () => {
    const focusMock = jest.fn();
    const { getByTestId } = render(
      <SearchInput
        value=""
        onInputChange={jest.fn()}
        onFocus={focusMock}
      />
    );

    fireEvent(getByTestId("search-bar"), new CustomEvent("ionFocus"));

    expect(focusMock).toBeCalledWith(true);
  });

  test("blur", async () => {
    const focusMock = jest.fn();
    const { getByTestId } = render(
      <SearchInput
        value=""
        onInputChange={jest.fn()}
        onFocus={focusMock}
      />
    );

    fireEvent(getByTestId("search-bar"), new CustomEvent("ionBlur"));

    expect(focusMock).toBeCalledWith(false);
  });

  test("blur with value", async () => {
    const focusMock = jest.fn();
    const { getByTestId } = render(
      <SearchInput
        value="value"
        onInputChange={jest.fn()}
        onFocus={focusMock}
      />
    );

    fireEvent(getByTestId("search-bar"), new CustomEvent("ionBlur"));

    expect(focusMock).not.toBeCalled();
  });
});
