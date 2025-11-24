const createOrUpdateBasicRecordMock = jest.fn();
import { fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import TRANSLATIONS from "../../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../../routes/paths";
import { makeTestStore } from "../../../../utils/makeTestStore";
import { passcodeFiller } from "../../../../utils/passcodeFiller";
import { VerifySeedPhraseCard } from "./VerifySeedPhraseCard";
import { VerifySeedPhraseModal } from "./VerifySeedPhraseModal";
import { MiscRecordId } from "../../../../../core/agent/agent.types";

const SeedPhrase =
  "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15 example16 example17 example18";

jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      getMnemonic: jest.fn(() => Promise.resolve(SeedPhrase)),
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
      basicStorage: {
        createOrUpdateBasicRecord: (params: unknown) =>
          createOrUpdateBasicRecordMock(params),
      },
    },
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

const MNEMONIC_WORDS = 18;

const initialState = {
  stateCache: {
    routes: [TabsRoutePath.HOME],
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
};

const dispatchMock = jest.fn();
const storeMocked = {
  ...makeTestStore(initialState),
  dispatch: dispatchMock,
};

describe("Verify Seed Phrase", () => {
  describe("Card", () => {
    test("Render", () => {
      const { getByText } = render(
        <Provider store={storeMocked}>
          <VerifySeedPhraseCard />
        </Provider>
      );

      expect(
        getByText(TRANSLATIONS.tabs.home.tab.verifyseedphrase.header)
      ).toBeVisible();
      expect(
        getByText(TRANSLATIONS.tabs.home.tab.verifyseedphrase.text)
      ).toBeVisible();
      expect(
        getByText(TRANSLATIONS.tabs.home.tab.verifyseedphrase.button)
      ).toBeVisible();
    });

    test("hidden when seedPhraseIsSet is true", () => {
      const initialState = {
        stateCache: {
          routes: [TabsRoutePath.HOME],
          authentication: {
            loggedIn: true,
            time: 0,
            passcodeIsSet: true,
            seedPhraseIsSet: true,
            passwordIsSet: false,
            passwordIsSkipped: true,
            ssiAgentIsSet: true,
            ssiAgentUrl: "",
            finishSetupBiometrics: true,
          },
          isOnline: true,
        },
      };

      const dispatchMock = jest.fn();
      const storeMocked = {
        ...makeTestStore(initialState),
        dispatch: dispatchMock,
      };

      const { queryByText } = render(
        <Provider store={storeMocked}>
          <VerifySeedPhraseCard />
        </Provider>
      );

      expect(
        queryByText(TRANSLATIONS.tabs.home.tab.verifyseedphrase.header)
      ).toBeNull();
      expect(
        queryByText(TRANSLATIONS.tabs.home.tab.verifyseedphrase.text)
      ).toBeNull();
      expect(
        queryByText(TRANSLATIONS.tabs.home.tab.verifyseedphrase.button)
      ).toBeNull();
    });

    test("show recovery modal", async () => {
      const { getByText } = render(
        <Provider store={storeMocked}>
          <VerifySeedPhraseCard />
        </Provider>
      );

      expect(
        getByText(TRANSLATIONS.tabs.home.tab.verifyseedphrase.button)
      ).toBeVisible();

      fireEvent.click(
        getByText(TRANSLATIONS.tabs.home.tab.verifyseedphrase.button)
      );

      await waitFor(() => {
        expect(
          getByText(TRANSLATIONS.verifyseedphrase.title.recovery)
        ).toBeVisible();
      });
    });

    test("Show success message", async () => {
      const { getByText, getByTestId, queryByText } = render(
        <Provider store={storeMocked}>
          <VerifySeedPhraseCard />
        </Provider>
      );

      expect(
        getByText(TRANSLATIONS.tabs.home.tab.verifyseedphrase.button)
      ).toBeVisible();

      fireEvent.click(
        getByText(TRANSLATIONS.tabs.home.tab.verifyseedphrase.button)
      );

      expect(
        getByText(TRANSLATIONS.verifyseedphrase.title.recovery)
      ).toBeVisible();

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
      expect(
        getByTestId("primary-button-confirm-view-seedpharse")
      ).toBeVisible();

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
            TRANSLATIONS.settings.sections.security.seedphrase.page.button
              .verify
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
        expect(originalSeedPhraseContainer.childNodes.length).toBe(
          MNEMONIC_WORDS
        )
      );

      expect(continueButton).toBeDisabled();

      SeedPhrase.split(" ").forEach(async (word) => {
        fireEvent.click(getByText(`${word}`));
      });

      await waitFor(() =>
        expect(matchingSeedPhraseContainer.childNodes.length).toBe(
          MNEMONIC_WORDS
        )
      );

      await waitFor(() =>
        expect(continueButton).toHaveAttribute("disabled", "false")
      );

      fireEvent.click(continueButton);

      await waitFor(() =>
        expect(createOrUpdateBasicRecordMock).toBeCalledWith(
          expect.objectContaining({
            id: MiscRecordId.VERIFY_SEEDPHRASE,
            content: {
              value: true,
            },
          })
        )
      );

      await waitFor(() => {
        expect(
          getByText(TRANSLATIONS.tabs.home.tab.verifyseedphrase.successmessage)
        ).toBeVisible();
      });
    });
  });

  describe("Verify seed phrase modal", () => {
    test("Render show seed phrase stage", async () => {
      const { getByText } = render(
        <Provider store={storeMocked}>
          <VerifySeedPhraseModal
            setShow={jest.fn}
            show
            onVerifySuccess={jest.fn}
          />
        </Provider>
      );

      expect(
        getByText(TRANSLATIONS.verifyseedphrase.title.recovery)
      ).toBeVisible();

      await waitFor(() => {
        expect(
          getByText(
            TRANSLATIONS.settings.sections.security.seedphrase.page.tips.one
          )
        ).toBeVisible();

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
    });

    test("Render verify seed phrase stage", async () => {
      const { getByText, getByTestId, queryByText } = render(
        <Provider store={storeMocked}>
          <VerifySeedPhraseModal
            setShow={jest.fn}
            show
            onVerifySuccess={jest.fn}
          />
        </Provider>
      );

      expect(
        getByText(TRANSLATIONS.verifyseedphrase.title.recovery)
      ).toBeVisible();

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
      expect(
        getByTestId("primary-button-confirm-view-seedpharse")
      ).toBeVisible();

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
            TRANSLATIONS.settings.sections.security.seedphrase.page.button
              .verify
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
          getByText(TRANSLATIONS.verifyseedphrase.title.verify)
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
        expect(originalSeedPhraseContainer.childNodes.length).toBe(
          MNEMONIC_WORDS
        )
      );

      expect(continueButton).toBeDisabled();

      SeedPhrase.split(" ").forEach(async (word) => {
        fireEvent.click(getByText(`${word}`));
      });

      await waitFor(() =>
        expect(matchingSeedPhraseContainer.childNodes.length).toBe(
          MNEMONIC_WORDS
        )
      );

      await waitFor(() =>
        expect(continueButton).toHaveAttribute("disabled", "false")
      );

      fireEvent.click(continueButton);

      await waitFor(() =>
        expect(createOrUpdateBasicRecordMock).toBeCalledWith(
          expect.objectContaining({
            id: MiscRecordId.VERIFY_SEEDPHRASE,
            content: {
              value: true,
            },
          })
        )
      );
    });
  });
});
