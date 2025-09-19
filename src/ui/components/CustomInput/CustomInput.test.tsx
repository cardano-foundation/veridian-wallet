import { fireEvent, render, waitFor } from "@testing-library/react";
import { eyeOutline } from "ionicons/icons";
import { act } from "react";
import { CustomInput } from "./CustomInput";

const hideKeyboard = jest.fn();
jest.mock("@capacitor/keyboard", () => ({
  ...jest.requireActual("@capacitor/keyboard"),
  Keyboard: {
    hide: () => hideKeyboard(),
  },
}));

describe("Custom input", () => {
  const onChangeMock = jest.fn();

  test("Render icon button", async () => {
    const action = jest.fn();

    const { getByTestId } = render(
      <CustomInput
        dataTestId="test-input"
        value=""
        onChangeInput={onChangeMock}
        actionIcon={eyeOutline}
        action={action}
      />
    );

    expect(getByTestId("test-input")).toBeVisible();
    expect(getByTestId("test-input-action")).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("test-input-action"));
    });

    expect(action).toBeCalled();
  });

  test("On Focus/Blur", async () => {
    const focus = jest.fn();

    const { getByTestId } = render(
      <CustomInput
        dataTestId="test-input"
        value=""
        hiddenInput
        onChangeInput={onChangeMock}
        onChangeFocus={focus}
      />
    );

    act(() => {
      fireEvent(getByTestId("test-input"), new CustomEvent("ionFocus"));
    });

    expect(focus).toBeCalledWith(true);

    act(() => {
      fireEvent(getByTestId("test-input"), new CustomEvent("ionBlur"));
    });

    expect(focus).toBeCalledWith(false);
  });

  test("On change", async () => {
    const focus = jest.fn();

    const { getByTestId } = render(
      <CustomInput
        dataTestId="test-input"
        value=""
        onChangeInput={onChangeMock}
        onChangeFocus={focus}
      />
    );

    act(() => {
      fireEvent(
        getByTestId("test-input"),
        new CustomEvent("ionInput", {
          detail: { value: "test" },
        })
      );
    });

    expect(onChangeMock).toBeCalled();
  });

  test("Show password", async () => {
    const { getByTestId } = render(
      <CustomInput
        dataTestId="test-input"
        value=""
        onChangeInput={onChangeMock}
        hiddenInput
      />
    );

    expect((getByTestId("test-input") as HTMLInputElement).type).toBe(
      "password"
    );

    act(() => {
      fireEvent.click(getByTestId("test-input-hide-btn"));
    });

    await waitFor(() => {
      expect((getByTestId("test-input") as HTMLInputElement).type).toBe("text");
    });
  });

  test("Error", async () => {
    const focus = jest.fn();

    const { getByTestId } = render(
      <CustomInput
        dataTestId="test-input"
        value=""
        error
        onChangeInput={onChangeMock}
        onChangeFocus={focus}
      />
    );

    expect(
      getByTestId(
        "test-input"
      ).parentElement?.parentElement?.className.includes("error")
    ).toBe(true);
  });

  test("Hidden keyboard when press enter or return", async () => {
    const focus = jest.fn();

    const { getByTestId } = render(
      <CustomInput
        dataTestId="test-input"
        value=""
        error
        onChangeInput={onChangeMock}
        onChangeFocus={focus}
      />
    );

    fireEvent.keyDown(getByTestId("test-input"), {
      key: "Enter",
    });

    expect(hideKeyboard).toBeCalled();
  });
});
