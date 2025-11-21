import { fireEvent, render } from "@testing-library/react";
import { Provider } from "react-redux";

import { RoutePath } from "../../../routes";
import { StoreMockedProps } from "../../pages/LockPage/LockPage.test";
import { makeTestStore } from "../../utils/makeTestStore";
import { PasscodeModule } from "./PasscodeModule";

const initialState = {
  stateCache: {
    routes: [RoutePath.SSI_AGENT],
    authentication: {
      loggedIn: false,
      time: Date.now(),
      passcodeIsSet: true,
      seedPhraseIsSet: false,
      loginAttempt: {
        attempts: 0,
        lockedUntil: Date.now(),
      },
    },
  },
  seedPhraseCache: {
    seedPhrase: "",
    bran: "",
  },
  biometricsCache: {
    enabled: false,
  },
};

const dispatchMock = jest.fn();
const storeMocked = (initialState: StoreMockedProps) => {
  return {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };
};

describe("Passcode Module", () => {
  const errorFunction = jest.fn();
  let handlePinChange = jest.fn(() => 0);
  const handleRemove = jest.fn();

  test("Clicking on a number button returns a digit", async () => {
    const { getByText, unmount } = render(
      <Provider store={storeMocked(initialState)}>
        <PasscodeModule
          error={errorFunction()}
          passcode="passcode"
          handlePinChange={handlePinChange}
          handleRemove={handleRemove()}
        />
      </Provider>
    );
    for (let i = 0; i < 9; i++) {
      const buttonElement = getByText(i);
      fireEvent.click(buttonElement);
      expect(handlePinChange()).toBe(i);
      handlePinChange = jest.fn(() => i + 1);
    }
    unmount();
  });
});
