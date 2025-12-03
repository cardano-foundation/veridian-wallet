import { fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import TRANSLATIONS from "../../../locales/en/en.json";
import { showVerifySeedPhraseAlert } from "../../../store/reducers/stateCache";
import { makeTestStore } from "../../utils/makeTestStore";
import { VerifySeedPhraseAlert } from "./VerifySeedPhraseAlert";
import { passcodeFiller } from "../../utils/passcodeFiller";

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

const SeedPhrase =
  "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15 example16 example17 example18";
const markSeedPhraseAsVerifiedMock = jest.fn();
jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      getMnemonic: jest.fn(() => Promise.resolve(SeedPhrase)),
      markSeedPhraseAsVerified: () => markSeedPhraseAsVerifiedMock(),
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
    },
  },
}));

const MNEMONIC_WORDS = 18;

describe("VerifySeedPhraseAlert", () => {
  let store: any;

  beforeEach(() => {
    store = makeTestStore({
      stateCache: {
        showVerifySeedPhraseAlert: true,
        authentication: {
          loggedIn: true,
          time: 0,
          passcodeIsSet: true,
          seedPhraseIsSet: false,
          passwordIsSet: false,
          passwordIsSkipped: true,
          ssiAgentIsSet: true,
          ssiAgentUrl: "",
          finishSetupBiometrics: true,
        },
        isOnline: true,
      },
    });
    store.dispatch = jest.fn();
  });

  test("should render modal when showAlert is true", () => {
    const { getByText } = render(
      <Provider store={store}>
        <VerifySeedPhraseAlert />
      </Provider>
    );

    expect(getByText(TRANSLATIONS.verifyseedphrasealert.title)).toBeVisible();
    expect(getByText(TRANSLATIONS.verifyseedphrasealert.text)).toBeVisible();
    expect(
      getByText(TRANSLATIONS.verifyseedphrasealert.firstinfo)
    ).toBeVisible();
    expect(
      getByText(TRANSLATIONS.verifyseedphrasealert.secondinfo)
    ).toBeVisible();
    expect(getByText(TRANSLATIONS.verifyseedphrasealert.button)).toBeVisible();
  });

  test("should open VerifySeedPhraseModal when button clicked", async () => {
    const { getByText, getByTestId, queryByText } = render(
      <Provider store={store}>
        <VerifySeedPhraseAlert />
      </Provider>
    );

    const button = getByText(TRANSLATIONS.verifyseedphrasealert.button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        getByText(TRANSLATIONS.verifyseedphrase.title.recovery)
      ).toBeVisible();
    });

    await waitFor(() => {
      expect(
        getByText(
          TRANSLATIONS.settings.sections.security.seedphrase.page.button.next
        )
      ).toBeVisible();
    });

    fireEvent.click(
      getByText(
        TRANSLATIONS.settings.sections.security.seedphrase.page.button.next
      )
    );

    expect(getByTestId("confirm-view-seedpharse")).toBeVisible();
    expect(getByTestId("primary-button-confirm-view-seedpharse")).toBeVisible();

    fireEvent.click(getByTestId("condition-item-0"));
    fireEvent.click(getByTestId("condition-item-1"));
    fireEvent.click(getByTestId("condition-item-2"));

    await waitFor(() => {
      expect(
        getByTestId("primary-button-confirm-view-seedpharse").getAttribute(
          "disabled"
        )
      ).toBe("false");
    });

    fireEvent.click(getByTestId("primary-button-confirm-view-seedpharse"));

    await waitFor(() => {
      expect(getByText(TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(
        queryByText(
          TRANSLATIONS.settings.sections.security.seedphrase.page.button.verify
        )
      ).toBeVisible();
    });

    fireEvent.click(
      getByText(
        TRANSLATIONS.settings.sections.security.seedphrase.page.button.verify
      )
    );

    await waitFor(() => {
      expect(
        getByText(TRANSLATIONS.verifyseedphrase.onboarding.button.continue)
      ).toBeVisible();
    });

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

    SeedPhrase.split(" ").forEach(async (word) => {
      fireEvent.click(getByText(`${word}`));
    });

    await waitFor(() =>
      expect(matchingSeedPhraseContainer.childNodes.length).toBe(MNEMONIC_WORDS)
    );

    await waitFor(() =>
      expect(continueButton).toHaveAttribute("disabled", "false")
    );

    fireEvent.click(continueButton);

    await waitFor(() => expect(markSeedPhraseAsVerifiedMock).toBeCalled());

    expect(store.dispatch).toHaveBeenCalledWith(
      showVerifySeedPhraseAlert(false)
    );
  });
});
