import { IonReactMemoryRouter, IonReactRouter } from "@ionic/react-router";
import { ionFireEvent as fireEvent } from "@ionic/react-test-utils";
import { render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";
import { Route } from "react-router-dom";
import { KeyStoreKeys } from "../../../core/storage";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { RoutePath } from "../../../routes";
import { makeTestStore } from "../../utils/makeTestStore";
import { GenerateSeedPhrase } from "../GenerateSeedPhrase";
import { VerifySeedPhrase } from "../VerifySeedPhrase";

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        deleteById: jest.fn(() => Promise.resolve()),
      },
    },
  },
}));

const secureStorageMock = jest.fn((...arg: unknown[]) => Promise.resolve(arg));
jest.mock("../../../core/storage", () => ({
  ...jest.requireActual("../../../core/storage"),
  SecureStorage: {
    set: (...arg: unknown[]) => secureStorageMock(...arg),
    delete: jest.fn(),
  },
}));

const MNEMONIC_WORDS = 18;

describe("Verify Seed Phrase Page", () => {
  const dispatchMock = jest.fn();
  const initialState = {
    stateCache: {
      routes: [RoutePath.VERIFY_SEED_PHRASE],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
        seedPhraseIsSet: false,
      },
    },
    seedPhraseCache: {
      seedPhrase:
        "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15 example16 example17 example18",
      bran: "",
    },
  };

  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };
  test("The user can navigate from Generate to Verify Seed Phrase page", async () => {
    const seedPhrase: string[] = [];
    const history = createMemoryHistory();
    history.push(RoutePath.GENERATE_SEED_PHRASE);

    const { getByTestId, queryByText, findByText } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter
          history={history}
          initialEntries={[RoutePath.GENERATE_SEED_PHRASE]}
        >
          <Route
            path={RoutePath.GENERATE_SEED_PHRASE}
            component={GenerateSeedPhrase}
          />
          <Route
            path={RoutePath.VERIFY_SEED_PHRASE}
            component={VerifySeedPhrase}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    const revealSeedPhraseButton = getByTestId("reveal-seed-phrase-button");
    const termsCheckbox = getByTestId("terms-and-conditions-checkbox");
    const generateContinueButton = getByTestId(
      "primary-button-generate-seed-phrase"
    );

    act(() => {
      fireEvent.click(revealSeedPhraseButton);
      fireEvent.click(termsCheckbox);
      fireEvent.click(generateContinueButton);
    });

    const seedPhraseContainer = getByTestId("seed-phrase-container");
    for (let i = 0, len = seedPhraseContainer.childNodes.length; i < len; i++) {
      seedPhrase.push(
        seedPhraseContainer.childNodes[i].childNodes[1].textContent || ""
      );
    }

    const generateConfirmButton = await findByText(
      EN_TRANSLATIONS.generateseedphrase.alert.confirm.button.confirm
    );

    act(() => {
      fireEvent.click(generateConfirmButton);
    });

    await waitFor(() =>
      expect(
        queryByText(EN_TRANSLATIONS.verifyseedphrase.onboarding.title)
      ).toBeVisible()
    );

    for (let i = 0, len = seedPhrase.length; i < len; i++) {
      await waitFor(() => expect(queryByText(seedPhrase[i])).toBeVisible());
    }
  });

  test("The user can't Verify the Seed Phrase", async () => {
    const history = createMemoryHistory();
    history.push(RoutePath.VERIFY_SEED_PHRASE);

    const { getByTestId, getByText, queryByText, findByText, unmount } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter
          history={history}
          initialEntries={[RoutePath.VERIFY_SEED_PHRASE]}
        >
          <Route
            path={RoutePath.VERIFY_SEED_PHRASE}
            component={VerifySeedPhrase}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    const continueButton = getByTestId("primary-button-verify-seed-phrase");
    const originalSeedPhraseContainer = getByTestId(
      "original-seed-phrase-container"
    );
    const matchingSeedPhraseContainer = getByTestId(
      "matching-seed-phrase-container"
    );
    await waitFor(() =>
      expect(originalSeedPhraseContainer.childNodes.length).toBe(MNEMONIC_WORDS)
    );

    expect(continueButton).toBeDisabled();

    for (let index = 0; index < MNEMONIC_WORDS; index++) {
      fireEvent.click(originalSeedPhraseContainer.childNodes[0]);
    }

    await waitFor(() =>
      expect(matchingSeedPhraseContainer.childNodes.length).toBe(MNEMONIC_WORDS)
    );

    await waitFor(() =>
      expect(continueButton).toHaveAttribute("disabled", "false")
    );

    fireEvent.click(continueButton);

    const text = await findByText(
      EN_TRANSLATIONS.verifyseedphrase.alert.fail.text
    );

    expect(text).toBeVisible();

    fireEvent.click(
      getByText(EN_TRANSLATIONS.verifyseedphrase.alert.fail.button.confirm)
    );

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATIONS.verifyseedphrase.alert.fail.text)
      ).toBeNull();
    });

    unmount();
  });

  test("The user can Verify the Seed Phrase when Onboarding", async () => {
    const history = createMemoryHistory();
    history.push(RoutePath.VERIFY_SEED_PHRASE);
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <IonReactRouter history={history}>
          <VerifySeedPhrase />
        </IonReactRouter>
      </Provider>
    );

    const continueButton = getByTestId("primary-button-verify-seed-phrase");
    const originalSeedPhraseContainer = getByTestId(
      "original-seed-phrase-container"
    );
    const matchingSeedPhraseContainer = getByTestId(
      "matching-seed-phrase-container"
    );
    await waitFor(() =>
      expect(originalSeedPhraseContainer.childNodes.length).toBe(MNEMONIC_WORDS)
    );

    expect(continueButton).toBeDisabled();

    initialState.seedPhraseCache.seedPhrase.split(" ").forEach(async (word) => {
      fireEvent.click(getByText(`${word}`));
    });

    await waitFor(() =>
      expect(matchingSeedPhraseContainer.childNodes.length).toBe(MNEMONIC_WORDS)
    );

    await waitFor(() =>
      expect(continueButton).toHaveAttribute("disabled", "false")
    );

    act(() => {
      fireEvent.click(continueButton);
    });

    await waitFor(() => {
      expect(secureStorageMock).toBeCalled();
    });
  });

  test("The user can Verify the Seed Phrase when generating a new seed phrase", async () => {
    const history = createMemoryHistory();
    history.push(RoutePath.VERIFY_SEED_PHRASE);
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <IonReactRouter history={history}>
          <VerifySeedPhrase />
        </IonReactRouter>
      </Provider>
    );

    const continueButton = getByTestId("primary-button-verify-seed-phrase");
    const originalSeedPhraseContainer = getByTestId(
      "original-seed-phrase-container"
    );
    const matchingSeedPhraseContainer = getByTestId(
      "matching-seed-phrase-container"
    );
    await waitFor(() =>
      expect(originalSeedPhraseContainer.childNodes.length).toBe(MNEMONIC_WORDS)
    );

    expect(continueButton).toBeDisabled();

    initialState.seedPhraseCache.seedPhrase.split(" ").forEach(async (word) => {
      fireEvent.click(getByText(`${word}`));
    });

    await waitFor(() =>
      expect(matchingSeedPhraseContainer.childNodes.length).toBe(MNEMONIC_WORDS)
    );

    await waitFor(() =>
      expect(continueButton).toHaveAttribute("disabled", "false")
    );

    fireEvent.click(continueButton);

    await waitFor(() =>
      expect(secureStorageMock).toBeCalledWith(
        KeyStoreKeys.SIGNIFY_BRAN,
        initialState.seedPhraseCache.bran
      )
    );
  });

  test("calls handleOnBack when back button is clicked", async () => {
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [RoutePath.VERIFY_SEED_PHRASE],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          seedPhraseIsSet: false,
        },
      },
      seedPhraseCache: {
        seedPhrase: "example1 example2 example3 example4 example5",
        bran: "bran",
      },
    };

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };
    const history = createMemoryHistory();
    history.push(RoutePath.VERIFY_SEED_PHRASE);
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter
          history={history}
          initialEntries={[RoutePath.VERIFY_SEED_PHRASE]}
        >
          <Route
            path={RoutePath.VERIFY_SEED_PHRASE}
            component={VerifySeedPhrase}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    fireEvent.click(getByText("example1"));
    fireEvent.click(getByText("example2"));
    fireEvent.click(getByText("example3"));
    fireEvent.click(getByText("example4"));
    fireEvent.click(getByText("example5"));

    const continueButton = getByTestId(
      "primary-button-verify-seed-phrase"
    ) as HTMLButtonElement;

    expect(continueButton.disabled).toBe(false);

    const backButton = getByTestId("close-button");
    act(() => {
      fireEvent.click(backButton);
    });

    expect(dispatchMock).toBeCalledTimes(2);
  });

  test("The user can remove words from the Seed Phrase", async () => {
    const history = createMemoryHistory();
    history.push(RoutePath.VERIFY_SEED_PHRASE);

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter
          history={history}
          initialEntries={[RoutePath.VERIFY_SEED_PHRASE]}
        >
          <Route
            path={RoutePath.VERIFY_SEED_PHRASE}
            component={VerifySeedPhrase}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    const continueButton = getByTestId("primary-button-verify-seed-phrase");
    const originalSeedPhraseContainer = getByTestId(
      "original-seed-phrase-container"
    );
    const matchingSeedPhraseContainer = getByTestId(
      "matching-seed-phrase-container"
    );
    await waitFor(() =>
      expect(originalSeedPhraseContainer.childNodes.length).toBe(MNEMONIC_WORDS)
    );

    expect(continueButton).toBeDisabled();

    for (let index = 0; index < MNEMONIC_WORDS; index++) {
      fireEvent.click(originalSeedPhraseContainer.childNodes[0]);
    }

    await waitFor(() =>
      expect(matchingSeedPhraseContainer.childNodes.length).toBe(MNEMONIC_WORDS)
    );

    for (let index = 0; index < MNEMONIC_WORDS; index++) {
      fireEvent.click(matchingSeedPhraseContainer.childNodes[0]);
    }

    expect(matchingSeedPhraseContainer.childNodes.length).toBe(1);
  });

  test("The user can not verify the Seed Phrase when Onboarding", async () => {
    const history = createMemoryHistory();
    history.push(RoutePath.VERIFY_SEED_PHRASE);
    const { getByTestId, getByText, queryByText } = render(
      <Provider store={storeMocked}>
        <IonReactRouter history={history}>
          <VerifySeedPhrase />
        </IonReactRouter>
      </Provider>
    );

    const continueButton = getByTestId("primary-button-verify-seed-phrase");
    const originalSeedPhraseContainer = getByTestId(
      "original-seed-phrase-container"
    );
    const matchingSeedPhraseContainer = getByTestId(
      "matching-seed-phrase-container"
    );
    await waitFor(() =>
      expect(originalSeedPhraseContainer.childNodes.length).toBe(MNEMONIC_WORDS)
    );

    expect(continueButton).toBeDisabled();

    initialState.seedPhraseCache.seedPhrase
      .split(" ")
      .sort((a, b) => a.localeCompare(b))
      .forEach(async (word) => {
        fireEvent.click(getByText(`${word}`));
      });

    await waitFor(() =>
      expect(matchingSeedPhraseContainer.childNodes.length).toBe(MNEMONIC_WORDS)
    );

    await waitFor(() =>
      expect(continueButton).toHaveAttribute("disabled", "false")
    );

    fireEvent.click(continueButton);

    await waitFor(() =>
      expect(
        queryByText(EN_TRANSLATIONS.verifyseedphrase.alert.fail.text)
      ).toBeVisible()
    );
  });

  test("Display seed phrase number on matching section", async () => {
    const history = createMemoryHistory();
    history.push(RoutePath.VERIFY_SEED_PHRASE);
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <IonReactRouter history={history}>
          <VerifySeedPhrase />
        </IonReactRouter>
      </Provider>
    );

    const matchingSeedPhraseContainer = getByTestId(
      "matching-seed-phrase-container"
    );
    const originalSeedPhraseContainer = getByTestId(
      "original-seed-phrase-container"
    );

    await waitFor(() =>
      expect(originalSeedPhraseContainer.childNodes.length).toBe(MNEMONIC_WORDS)
    );

    initialState.seedPhraseCache.seedPhrase.split(" ").forEach(async (word) => {
      fireEvent.click(getByText(`${word}`));
    });

    await waitFor(() => {
      const seedNumberElements = matchingSeedPhraseContainer.querySelectorAll(
        'span[data-testid*="word-index-number"]'
      );
      expect(seedNumberElements.length).toBe(MNEMONIC_WORDS);
    });
  });
  test("Hidden seed phrase number on original section", async () => {
    const history = createMemoryHistory();
    history.push(RoutePath.VERIFY_SEED_PHRASE);
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactRouter history={history}>
          <VerifySeedPhrase />
        </IonReactRouter>
      </Provider>
    );

    const originalSeedPhraseContainer = getByTestId(
      "original-seed-phrase-container"
    );

    await waitFor(() => {
      const seedNumberElements = originalSeedPhraseContainer.querySelectorAll(
        'span[data-testid*="word-index-number"]'
      );
      expect(seedNumberElements.length).toBe(0);
    });
  });
  test("Show switch onboarding modal", async () => {
    const history = createMemoryHistory();
    history.push(RoutePath.VERIFY_SEED_PHRASE);
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <IonReactRouter history={history}>
          <VerifySeedPhrase />
        </IonReactRouter>
      </Provider>
    );

    fireEvent.click(getByTestId("tertiary-button-verify-seed-phrase"));

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.switchmodemodal.title)).toBeVisible();
    });
  });
});
