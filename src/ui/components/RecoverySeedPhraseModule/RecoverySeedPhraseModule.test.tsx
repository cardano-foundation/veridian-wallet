import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";

import TRANSLATIONS from "../../../locales/en/en.json";
import { setSeedPhraseCache } from "../../../store/reducers/seedPhraseCache";
import { makeTestStore } from "../../utils/makeTestStore";
import { RecoverySeedPhraseModule } from "./RecoverySeedPhraseModule";

const SEED_PHRASE_LENGTH = 18;

const verifySeedPhraseFnc = jest.fn();

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      isMnemonicValid: () => verifySeedPhraseFnc(),
    },
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
  };
});

describe("Recovery Seed Phrase", () => {
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
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  test("Render screen", () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <RecoverySeedPhraseModule
          title={TRANSLATIONS.verifyrecoveryseedphrase.title}
          description={TRANSLATIONS.verifyrecoveryseedphrase.paragraph.top}
          testId="verify-recovery-seed-phrase"
          onVerifySuccess={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(TRANSLATIONS.verifyrecoveryseedphrase.title)
    ).toBeVisible();
    expect(
      getByText(TRANSLATIONS.verifyrecoveryseedphrase.paragraph.top)
    ).toBeVisible();
    expect(
      getByText(
        TRANSLATIONS.verifyrecoveryseedphrase.button.continue
      ).getAttribute("disabled")
    ).toBe("true");
    expect(getByTestId("word-input-0")).toBeVisible();
  });

  test("Render suggest seed phrase", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <RecoverySeedPhraseModule
          title={TRANSLATIONS.verifyrecoveryseedphrase.title}
          description={TRANSLATIONS.verifyrecoveryseedphrase.paragraph.top}
          testId="verify-recovery-seed-phrase"
          onVerifySuccess={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(TRANSLATIONS.verifyrecoveryseedphrase.title)
    ).toBeVisible();

    const firstInput = getByTestId("word-input-0");
    act(() => {
      fireEvent.focus(firstInput);
      fireEvent.change(firstInput, {
        target: { value: "a" },
      });
    });

    expect(
      getByText(TRANSLATIONS.verifyrecoveryseedphrase.suggestions.title)
    ).toBeVisible();
    expect(getByText("abandon")).toBeVisible();
    expect(getByTestId("word-input-1")).toBeVisible();

    act(() => {
      fireEvent.click(getByText("abandon"));
    });

    await waitFor(() => {
      expect((firstInput as HTMLInputElement).value).toEqual("abandon");
    });
  });

  test("Render/clear word should match suggestion error", async () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={storeMocked}>
        <RecoverySeedPhraseModule
          title={TRANSLATIONS.verifyrecoveryseedphrase.title}
          description={TRANSLATIONS.verifyrecoveryseedphrase.paragraph.top}
          testId="verify-recovery-seed-phrase"
          onVerifySuccess={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(TRANSLATIONS.verifyrecoveryseedphrase.title)
    ).toBeVisible();

    const firstInput = getByTestId("word-input-0");
    act(() => {
      fireEvent.focus(firstInput);
      fireEvent.change(firstInput, {
        target: { value: "a" },
      });
    });

    expect(
      getByText(TRANSLATIONS.verifyrecoveryseedphrase.suggestions.title)
    ).toBeVisible();

    act(() => {
      fireEvent.blur(firstInput);
    });

    await waitFor(() => {
      expect(getByTestId("no-suggest-error")).toBeVisible();
    });

    act(() => {
      fireEvent.focus(firstInput);
      fireEvent.change(firstInput, {
        target: { value: "abandon" },
      });
    });

    expect(
      getByText(TRANSLATIONS.verifyrecoveryseedphrase.suggestions.title)
    ).toBeVisible();

    act(() => {
      fireEvent.blur(firstInput);
    });

    await waitFor(() => {
      expect(queryByTestId("no-suggest-error")).toBe(null);
    });
  });

  test("Fill all seed", async () => {
    verifySeedPhraseFnc.mockImplementation(() => {
      return Promise.resolve(true);
    });

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <RecoverySeedPhraseModule
          title={TRANSLATIONS.verifyrecoveryseedphrase.title}
          description={TRANSLATIONS.verifyrecoveryseedphrase.paragraph.top}
          testId="verify-recovery-seed-phrase"
          onVerifySuccess={jest.fn()}
        />
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
  });
});
