import { fireEvent, render } from "@testing-library/react";
import { Provider } from "react-redux";

import { PasscodeModule } from "./PasscodeModule";
import { StoreMockedProps } from "../../pages/LockPage/LockPage.test";
import { RoutePath } from "../../../routes";
import { OperationType } from "../../globals/types";
import { makeTestStore } from "../../utils/makeTestStore";

const initialState = {
  stateCache: {
    routes: [RoutePath.GENERATE_SEED_PHRASE],
    authentication: {
      loggedIn: false,
      time: Date.now(),
      passcodeIsSet: true,
      seedPhraseIsSet: false,
    },
    currentOperation: OperationType.IDLE,
  },
  seedPhraseCache: {
    seedPhrase: "",
    bran: "",
  },
  cryptoAccountsCache: {
    cryptoAccounts: [],
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
