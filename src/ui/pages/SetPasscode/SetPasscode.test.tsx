import React from "react";
import { MemoryRouter, Route } from "react-router-dom";

import { fireEvent, render, act } from "@testing-library/react";
import {
  ENTER_PASSCODE_DESCRIPTION,
  ENTER_PASSCODE_ERROR,
  ENTER_PASSCODE_LABEL,
  REENTER_PASSCODE_LABEL,
  ErrorMessage,
  SetPasscode,
} from "./SetPasscode";
import { GenerateSeedPhrase } from "../../components/GenerateSeedPhrase";

describe("SetPasscode Page", () => {
  test("renders create passcode label when passcode is not set", () => {
    const { getByText } = render(<SetPasscode />);
    const labelElement = getByText(ENTER_PASSCODE_LABEL);
    expect(labelElement).toBeInTheDocument();
  });

  test("renders create passcode description", () => {
    const { getByText } = render(<SetPasscode />);
    const descriptionElement = getByText(ENTER_PASSCODE_DESCRIPTION);
    expect(descriptionElement).toBeInTheDocument();
  });
});

describe("SetPasscode input", () => {
  test("clicking on a number button adds a digit to the passcode", () => {
    const { getByText, getByTestId } = render(<SetPasscode />);
    const buttonElement = getByText(/1/);
    fireEvent.click(buttonElement);
    const circleElement = getByTestId("circle-0");
    expect(circleElement.classList).toContain("circle-fill");
  });

  test("renders re-enter passcode label when passcode is set", () => {
    const { getByText } = render(<SetPasscode />);
    const buttonElement = getByText(/1/);
    fireEvent.click(buttonElement);
    fireEvent.click(buttonElement);
    fireEvent.click(buttonElement);
    fireEvent.click(buttonElement);
    fireEvent.click(buttonElement);
    fireEvent.click(buttonElement);
    const buttonContinue = getByText(/Continue/);
    fireEvent.click(buttonContinue);
    const labelElement = getByText(REENTER_PASSCODE_LABEL);
    expect(labelElement).toBeInTheDocument();
  });

  test("clicking on the backspace button removes a digit from the passcode", () => {
    const { getByText, getByTestId } = render(<SetPasscode />);
    const buttonElement = getByText(/1/);
    fireEvent.click(buttonElement);
    const backspaceButton = getByTestId("backspace-button");
    fireEvent.click(backspaceButton);
    const circleElement = getByTestId("circle-0");
    expect(circleElement.classList).not.toContain("circle-fill");
  });

  test("displays error message if passcode doesn't match when re-entering", () => {
    const { getByText, getByTestId } = render(<SetPasscode />);
    const buttonElement = getByText(/1/);
    fireEvent.click(buttonElement);
    const button0Element = getByText(/0/);
    fireEvent.click(button0Element);
    const button8Element = getByText(/8/);
    fireEvent.click(button8Element);
    const button9Element = getByText(/9/);
    fireEvent.click(button9Element);
    fireEvent.click(button9Element);
    fireEvent.click(button9Element);

    const continueButton = getByTestId("continue-button");
    fireEvent.click(continueButton);

    const reenter2ButtonElement = getByText(/2/);
    fireEvent.click(reenter2ButtonElement);
    const reenter3ButtonElement = getByText(/3/);
    fireEvent.click(reenter3ButtonElement);
    const reenter4ButtonElement = getByText(/4/);
    fireEvent.click(reenter4ButtonElement);
    const reenter5ButtonElement = getByText(/5/);
    fireEvent.click(reenter5ButtonElement);
    const reenter6ButtonElement = getByText(/6/);
    fireEvent.click(reenter6ButtonElement);
    const reenter7ButtonElement = getByText(/7/);
    fireEvent.click(reenter7ButtonElement);
    const errorMessage = getByText(ENTER_PASSCODE_ERROR);
    expect(errorMessage).toBeInTheDocument();
  });

  test("sets passcode and redirects to next page when passcode is entered correctly", () => {
    const { getByTestId, getByText, queryByText } = render(
      <MemoryRouter initialEntries={["/setpasscode"]}>
        <Route
          exact
          path="/setpasscode"
          component={SetPasscode}
        />
        <Route
          path="/generateseedphrase"
          component={GenerateSeedPhrase}
        />
      </MemoryRouter>
    );

    const buttonElement = getByText(/1/);
    fireEvent.click(buttonElement);
    fireEvent.click(buttonElement);
    fireEvent.click(buttonElement);
    fireEvent.click(buttonElement);
    fireEvent.click(buttonElement);
    fireEvent.click(buttonElement);

    const continueButton = getByTestId("continue-button");
    fireEvent.click(continueButton);

    fireEvent.click(buttonElement);
    fireEvent.click(buttonElement);
    fireEvent.click(buttonElement);
    fireEvent.click(buttonElement);
    fireEvent.click(buttonElement);
    fireEvent.click(buttonElement);

    expect(queryByText(ENTER_PASSCODE_DESCRIPTION)).not.toBeInTheDocument();

    const title = getByText(/Generate Seed Phrase/i);
    const overlay = getByTestId("seed-phrase-overlay");

    expect(title).toBeInTheDocument();
    expect(overlay).toBeInTheDocument();
  });
});

describe("ErrorMessage Component", () => {
  test("renders error message", () => {
    const { getByText } = render(<ErrorMessage message="Test error message" />);
    const message = getByText("Test error message");
    expect(message).toBeInTheDocument();
  });

  test("sets visibility to false after 2 seconds", async () => {
    jest.useFakeTimers();
    const { getByTestId } = render(
      <ErrorMessage message="Test error message" />
    );

    const errorContainer = getByTestId("error-messsage");
    expect(errorContainer).toHaveClass("visible");
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(errorContainer).not.toHaveClass("visible");
  });
});
