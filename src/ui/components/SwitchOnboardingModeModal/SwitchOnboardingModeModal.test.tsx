import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { SwitchOnboardingModeModal } from "./SwitchOnboardingModeModal";
import { OnboardingMode } from "./SwitchOnboardingModeModal.types";
import { makeTestStore } from "../../utils/makeTestStore";

const deleteById = jest.fn();
const createNew = jest.fn();

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        deleteById: () => deleteById(),
        createOrUpdateBasicRecord: () => createNew(),
      },
    },
  },
}));

const dispatchMock = jest.fn();
const initialState = {
  stateCache: {
    routes: ["/"],
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

const storeMocked = {
  ...makeTestStore(initialState),
  dispatch: dispatchMock,
};

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children }: { children: unknown }) => children,
  IonCheckbox: (props: any) => {
    return (
      <input
        type="checkbox"
        data-testid={props["data-testid"]}
        checked={props.checked}
        onChange={(event) => {
          props.onIonChange({
            detail: {
              checked: event.target.checked,
            },
          });
        }}
      />
    );
  },
}));

jest.mock("../../hooks", () => ({
  ...jest.requireActual("../../hooks"),
  useAppIonRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("Switch onboarding mode", () => {
  test("Render create mode", async () => {
    require("@ionic/react");
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <SwitchOnboardingModeModal
          isOpen={true}
          setOpen={jest.fn()}
          mode={OnboardingMode.Create}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.switchmodemodal.title)).toBeVisible();
    });

    expect(
      getByText(EN_TRANSLATIONS.switchmodemodal.create.paragraphtop)
    ).toBeVisible();

    expect(
      getByText(EN_TRANSLATIONS.switchmodemodal.create.paragraphbot)
    ).toBeVisible();

    expect(
      getByText(EN_TRANSLATIONS.switchmodemodal.button.continue)
    ).toBeVisible();

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.switchmodemodal.button.continue).getAttribute(
          "disabled"
        )
      ).toBe("");
    });

    fireEvent.click(getByTestId("confirm-checkbox"));

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.switchmodemodal.button.continue).getAttribute(
          "disabled"
        )
      ).toBe("false");
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-switch-modal"));
    });

    await waitFor(() => {
      expect(deleteById).toBeCalled();
    });
  });

  test("Render recovery mode", async () => {
    require("@ionic/react");
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <SwitchOnboardingModeModal
          isOpen={true}
          setOpen={jest.fn()}
          mode={OnboardingMode.Recovery}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.switchmodemodal.title)).toBeVisible();
    });

    expect(
      getByText(EN_TRANSLATIONS.switchmodemodal.recovery.paragraphtop)
    ).toBeVisible();

    expect(
      getByText(EN_TRANSLATIONS.switchmodemodal.recovery.paragraphbot)
    ).toBeVisible();

    expect(
      getByText(EN_TRANSLATIONS.switchmodemodal.button.continue)
    ).toBeVisible();

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.switchmodemodal.button.continue).getAttribute(
          "disabled"
        )
      ).toBe("");
    });

    fireEvent.click(getByTestId("confirm-checkbox"));

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.switchmodemodal.button.continue).getAttribute(
          "disabled"
        )
      ).toBe("false");
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-switch-modal"));
    });

    await waitFor(() => {
      expect(createNew).toBeCalled();
    });
  });
});
