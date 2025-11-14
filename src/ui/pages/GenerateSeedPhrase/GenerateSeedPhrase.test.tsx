import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";
import { Router } from "react-router-dom";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { RoutePath } from "../../../routes";
import { store } from "../../../store";
import { makeTestStore } from "../../utils/makeTestStore";
import { GenerateSeedPhrase } from "./GenerateSeedPhrase";

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      getBranAndMnemonic: () =>
        Promise.resolve({
          mnemonic:
            "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15 example16 example17 example18",
          bran: "brand",
        }),
    },
  },
}));

interface StoreMocked {
  stateCache: {
    routes: RoutePath[];
    authentication: {
      loggedIn: boolean;
      time: number;
      passcodeIsSet: boolean;
      seedPhraseIsSet?: boolean;
    };
  };
  seedPhraseCache: {
    seedPhrase: string;
    bran: string;
  };
}

const dispatchMock = jest.fn();
const history = createMemoryHistory();
const storeMocked = (initialState: StoreMocked) => {
  return {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };
};

describe("Generate Seed Phrase screen from Onboarding", () => {
  beforeAll(() => {
    history.push(RoutePath.GENERATE_SEED_PHRASE);
  });

  test("User can see Title and Security Overlay", () => {
    const { getByText, getByTestId, unmount } = render(
      <Provider store={store}>
        <Router history={history}>
          <GenerateSeedPhrase />
        </Router>
      </Provider>
    );

    const title = getByText(
      EN_TRANSLATIONS.generateseedphrase.onboarding.title
    );
    const overlay = getByTestId("seed-phrase-privacy-overlay");

    expect(title).toBeInTheDocument();
    expect(overlay).toBeInTheDocument();

    unmount();
  });

  test("User can dismiss the Security Overlay", async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <Router history={history}>
          <GenerateSeedPhrase />
        </Router>
      </Provider>
    );

    const seedPhraseModule = getByTestId("seed-phrase-module");
    const revealSeedPhraseButton = getByTestId("reveal-seed-phrase-button");

    expect(seedPhraseModule).toHaveClass("seed-phrase-hidden");

    act(() => {
      fireEvent.click(revealSeedPhraseButton);
    });
    await waitFor(() =>
      expect(seedPhraseModule).toHaveClass("seed-phrase-visible")
    );
  });

  test("User is prompted to save the seed phrase", async () => {
    const { getByText, getByTestId, findByText } = render(
      <Provider store={store}>
        <Router history={history}>
          <GenerateSeedPhrase />
        </Router>
      </Provider>
    );

    const revealSeedPhraseButton = getByTestId("reveal-seed-phrase-button");
    const continueButton = getByText(
      EN_TRANSLATIONS.generateseedphrase.onboarding.button.continue
    );
    const alertWrapper = getByTestId(
      "seed-phrase-generate-alert-continue-container"
    );
    const termsCheckbox = getByTestId("terms-and-conditions-checkbox");

    expect(alertWrapper).toHaveClass("alert-invisible");
    expect(continueButton).toBeDisabled;

    act(() => {
      fireEvent.click(revealSeedPhraseButton);
      fireEvent.change(termsCheckbox, { target: { checked: true } });
    });

    await waitFor(() => expect(continueButton).not.toBeDisabled);

    act(() => {
      fireEvent.click(continueButton);
    });

    const alertTitle = await findByText(
      EN_TRANSLATIONS.generateseedphrase.alert.confirm.text
    );

    await waitFor(() => expect(alertTitle).toBeVisible());
    await waitFor(() => expect(alertWrapper).toHaveClass("alert-visible"));
  });

  test("Clicking on second alert button will dismiss it", async () => {
    const { getByText, getByTestId, findByText, queryByText, unmount } = render(
      <Provider store={store}>
        <Router history={history}>
          <GenerateSeedPhrase />
        </Router>
      </Provider>
    );

    const revealSeedPhraseButton = getByTestId("reveal-seed-phrase-button");
    const continueButton = getByText(
      EN_TRANSLATIONS.generateseedphrase.onboarding.button.continue
    );

    const termsCheckbox = getByTestId("terms-and-conditions-checkbox");

    act(() => {
      fireEvent.click(revealSeedPhraseButton);
      fireEvent.change(termsCheckbox, { target: { checked: true } });
    });

    await waitFor(() => expect(continueButton).not.toBeDisabled);

    fireEvent.click(continueButton);

    const alertTitle = await findByText(
      EN_TRANSLATIONS.generateseedphrase.alert.confirm.text
    );

    await waitFor(() => expect(alertTitle).toBeVisible());

    fireEvent.click(
      getByText(EN_TRANSLATIONS.generateseedphrase.alert.confirm.button.cancel)
    );

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATIONS.generateseedphrase.alert.confirm.text)
      ).toBeNull();
    });

    unmount();
  });

  test("User can toggle the checkbox and modal", async () => {
    const { getByTestId, unmount } = render(
      <Provider store={store}>
        <Router history={history}>
          <GenerateSeedPhrase />
        </Router>
      </Provider>
    );
    const termsCheckbox = getByTestId("terms-and-conditions-checkbox");
    expect(termsCheckbox.hasAttribute('[checked="false"'));
    fireEvent.change(termsCheckbox, { target: { checked: true } });
    expect(termsCheckbox.hasAttribute('[checked="true"'));
    fireEvent.change(termsCheckbox, { target: { checked: false } });
    expect(termsCheckbox.hasAttribute('[checked="false"'));
    unmount();
  });
  test("Display seed number on seed phrase segment", async () => {
    const initialState = {
      stateCache: {
        routes: [RoutePath.GENERATE_SEED_PHRASE],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
      },
      seedPhraseCache: {
        seedPhrase: "",
        bran: "",
      },
    };

    const { getByTestId } = render(
      <Provider store={storeMocked(initialState)}>
        <Router history={history}>
          <GenerateSeedPhrase />
        </Router>
      </Provider>
    );

    const seedPhraseContainer = getByTestId("seed-phrase-container");

    await waitFor(() => {
      const seedNumberElements = seedPhraseContainer.querySelectorAll(
        'span[data-testid*="word-index-number"]'
      );
      expect(seedNumberElements.length).toBe(18);
    });
  });

  test("Show switch onboarding modal", async () => {
    const initialState = {
      stateCache: {
        routes: [RoutePath.GENERATE_SEED_PHRASE],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
      },
      seedPhraseCache: {
        seedPhrase: "",
        bran: "",
      },
    };

    const { getByTestId, getByText } = render(
      <Provider store={storeMocked(initialState)}>
        <Router history={history}>
          <GenerateSeedPhrase />
        </Router>
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.generateseedphrase.onboarding.button.switch)
    ).toBeVisible();

    fireEvent.click(getByTestId("tertiary-button-generate-seed-phrase"));

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.switchmodemodal.title)).toBeVisible();
    });
  });

  test("Show recovery docs", async () => {
    const initialState = {
      stateCache: {
        routes: [RoutePath.GENERATE_SEED_PHRASE],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
      },
      seedPhraseCache: {
        seedPhrase: "",
        bran: "",
      },
    };

    const { getByTestId, getByText } = render(
      <Provider store={storeMocked(initialState)}>
        <Router history={history}>
          <GenerateSeedPhrase />
        </Router>
      </Provider>
    );

    fireEvent.click(getByTestId("recovery-phrase-docs-btn"));

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.generateseedphrase.onboarding.recoveryseedphrasedocs
            .title
        )
      ).toBeVisible();
    });
  });
});
