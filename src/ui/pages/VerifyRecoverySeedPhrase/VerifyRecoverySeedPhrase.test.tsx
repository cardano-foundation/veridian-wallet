import { IonReactMemoryRouter } from "@ionic/react-router";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import TRANSLATIONS from "../../../locales/en/en.json";
import { RoutePath } from "../../../routes";
import { VerifyRecoverySeedPhrase } from "./VerifyRecoverySeedPhrase";
import { setSeedPhraseCache } from "../../../store/reducers/seedPhraseCache";

const SEED_PHRASE_LENGTH = 18;

const secureStorageGetFunc = jest.fn();
const secureStorageSetFunc = jest.fn();
const secureStorageDeleteFunc = jest.fn();
const verifySeedPhraseFnc = jest.fn();

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      isMnemonicValid: () => verifySeedPhraseFnc(),
    },
  },
}));

jest.mock("../../../core/storage", () => ({
  ...jest.requireActual("../../../core/storage"),
  SecureStorage: {
    get: (...args: unknown[]) => secureStorageGetFunc(...args),
    set: (...args: unknown[]) => secureStorageSetFunc(...args),
    delete: (...args: unknown[]) => secureStorageDeleteFunc(...args),
  },
}));

jest.mock("@ionic/react", () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual("react");

  return {
    ...jest.requireActual("@ionic/react"),
    IonInput: forwardRef((props: any, ref: any) => {
      const { onIonBlur, onIonFocus, onIonInput, value } = props;
      const testId = props["data-testid"];

      useImperativeHandle(ref, () => ({
        setFocus: jest.fn(),
      }));

      return (
        <input
          ref={ref}
          value={value}
          data-testid={testId}
          onBlur={onIonBlur}
          onFocus={onIonFocus}
          onChange={onIonInput}
        />
      );
    }),
    IonModal: ({ children, isOpen, ...props }: any) =>
      isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
  };
});

describe("Verify Recovery Seed Phrase", () => {
  const mockStore = configureStore();
  const dispatchMock = jest.fn();
  const initialState = {
    stateCache: {
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
        recoveryWalletProgress: true,
      },
    },
  };

  const storeMocked = {
    ...mockStore(initialState),
    dispatch: dispatchMock,
  };

  test("Fill all seed", async () => {
    const history = createMemoryHistory();
    history.push(RoutePath.VERIFY_RECOVERY_SEED_PHRASE);

    verifySeedPhraseFnc.mockImplementation(() => {
      return Promise.resolve(true);
    });

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter
          history={history}
          initialEntries={[RoutePath.VERIFY_RECOVERY_SEED_PHRASE]}
        >
          <VerifyRecoverySeedPhrase />
        </IonReactMemoryRouter>
      </Provider>
    );

    expect(
      getByText(TRANSLATIONS.verifyrecoveryseedphrase.title)
    ).toBeVisible();
    for (let i = 0; i < SEED_PHRASE_LENGTH; i++) {
      act(() => {
        const input = getByTestId(`word-input-${i}`);
        fireEvent.focus(input);
        fireEvent.change(input, {
          target: { value: "a" },
        });
      });

      await waitFor(() => {
        expect(getByText("abandon")).toBeVisible();
      });

      act(() => {
        fireEvent.click(getByText("abandon"));
      });

      if (i < SEED_PHRASE_LENGTH - 1) {
        await waitFor(() => {
          expect(getByTestId(`word-input-${i}`)).toBeVisible();
        });
      }
    }

    expect(
      getByText(
        TRANSLATIONS.verifyrecoveryseedphrase.button.continue
      ).getAttribute("disabled")
    ).toBe("false");

    act(() => {
      fireEvent.click(
        getByText(TRANSLATIONS.verifyrecoveryseedphrase.button.continue)
      );
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setSeedPhraseCache({
          seedPhrase:
            "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon",
          bran: "",
        })
      );
    });
  }, 15000);

  test("Show switch onboarding modal", async () => {
    const history = createMemoryHistory();
    history.push(RoutePath.VERIFY_RECOVERY_SEED_PHRASE);
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter
          history={history}
          initialEntries={[RoutePath.VERIFY_RECOVERY_SEED_PHRASE]}
        >
          <VerifyRecoverySeedPhrase />
        </IonReactMemoryRouter>
      </Provider>
    );

    fireEvent.click(getByTestId("tertiary-button-verify-recovery-seed-phrase"));

    await waitFor(() => {
      expect(getByText(TRANSLATIONS.switchmodemodal.title)).toBeVisible();
    });
  });
});
