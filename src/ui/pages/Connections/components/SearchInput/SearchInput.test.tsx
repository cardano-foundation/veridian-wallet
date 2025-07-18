const verifySecretMock = jest.fn();

import { ionFireEvent } from "@ionic/react-test-utils";
import { render } from "@testing-library/react";
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

    ionFireEvent.ionCancel(getByTestId("search-bar"));

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

    ionFireEvent.ionFocus(getByTestId("search-bar"));

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

    ionFireEvent.ionBlur(getByTestId("search-bar"));

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

    ionFireEvent.ionBlur(getByTestId("search-bar"));

    expect(focusMock).not.toBeCalled();
  });
});
