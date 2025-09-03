import { BiometryType } from "@capgo/capacitor-native-biometric";
import { IonInput } from "@ionic/react";
import { ionFireEvent } from "@ionic/react-test-utils";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { Agent } from "../../../../../core/agent/agent";
import { BasicRecord } from "../../../../../core/agent/records";
import TRANSLATIONS from "../../../../../locales/en/en.json";
import { RoutePath } from "../../../../../routes";
import { OperationType } from "../../../../globals/types";
import { passcodeFiller } from "../../../../utils/passcodeFiller";
import { CustomInputProps } from "../../../CustomInput/CustomInput.types";
import { ManagePassword } from "./ManagePassword";
import { makeTestStore } from "../../../../utils/makeTestStore";

const deletePasswordMock = jest.fn();

jest.mock("../../../../../core/storage", () => ({
  ...jest.requireActual("../../../../../core/storage"),
  SecureStorage: {
    delete: () => deletePasswordMock(),
  },
}));

jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        createOrUpdateBasicRecord: jest.fn(),
      },
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
    },
  },
}));

jest.mock("../../../../hooks/useBiometricsHook", () => ({
  useBiometricAuth: jest.fn(() => ({
    biometricsIsEnabled: false,
    biometricInfo: {
      isAvailable: false,
      hasCredentials: false,
      biometryType: BiometryType.FINGERPRINT
    },
    handleBiometricAuth: jest.fn(() => Promise.resolve(false)),
    setBiometricsIsEnabled: jest.fn(),
  })),
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

jest.mock("../../../CustomInput", () => ({
  CustomInput: (props: CustomInputProps) => {
    return (
      <>
        <IonInput
          data-testid={props.dataTestId}
          onIonInput={(e) => {
            props.onChangeInput(e.detail.value as string);
          }}
        />
      </>
    );
  },
}));

const initialState = {
  stateCache: {
    routes: [RoutePath.GENERATE_SEED_PHRASE],
    currentProfileId: "default-profile-id",
    authentication: {
      loggedIn: false,
      time: Date.now(),
      passcodeIsSet: true,
      seedPhraseIsSet: false,
    },
    currentOperation: OperationType.IDLE,
  },
};

const dispatchMock = jest.fn();
const storeMocked = {
  ...makeTestStore(initialState),
  dispatch: dispatchMock,
};

describe("Manage password", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock("@ionic/react", () => {
      const actualIonicReact = jest.requireActual("@ionic/react");
      return {
        ...actualIonicReact,
        getPlatforms: () => ["mobileweb"],
      };
    });
  });

  test("Cancel alert", async () => {
    const { queryByTestId, getByTestId, queryByText } = render(
      <Provider store={storeMocked}>
        <ManagePassword />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("settings-item-toggle-password")).toBeVisible();
      expect(queryByTestId("settings-item-change-password")).toBe(null);
    });

    expect(
      getByTestId("alert-cancel-enable-password").getAttribute("is-open")
    ).toBe("false");

    act(() => {
      fireEvent.click(getByTestId("settings-item-toggle-password"));
    });

    await waitFor(() => {
      expect(
        queryByText(
          TRANSLATIONS.settings.sections.security.managepassword.page.alert
            .enablemessage
        )
      ).toBeVisible();
    });

    await waitFor(() => {
      expect(
        getByTestId("alert-cancel-enable-password").getAttribute("is-open")
      ).toBe("true");
      expect(
        getByTestId("alert-cancel-enable-password-cancel-button")
      ).toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(
        getByTestId("alert-cancel-enable-password-cancel-button")
      );
    });

    await waitFor(() => {
      expect(
        queryByText(
          TRANSLATIONS.settings.sections.security.managepassword.page.alert
            .enablemessage
        )
      ).toBeNull();
    });

    await waitFor(() => {
      expect(
        getByTestId("alert-cancel-enable-password").getAttribute("is-open")
      ).toBe("false");

      expect(queryByTestId("create-password-modal")).toBe(null);
    });

    document.getElementsByTagName("html")[0].innerHTML = "";
  });

  test("Password not set", async () => {
    const { queryByTestId, getByTestId, getByText, queryByText, getAllByText } =
      render(
        <Provider store={storeMocked}>
          <ManagePassword />
        </Provider>
      );

    await waitFor(() => {
      expect(getByTestId("settings-item-toggle-password")).toBeVisible();
      expect(queryByTestId("settings-item-change-password")).toBe(null);
    });

    act(() => {
      fireEvent.click(getByTestId("settings-item-toggle-password"));
    });

    await waitFor(() => {
      // find the visible alert element (some alert overlays may be present but hidden)
      const alerts = Array.from(
        document.querySelectorAll(
          '[data-testid="alert-cancel-enable-password"]'
        )
      ) as HTMLElement[];
      const openAlert = alerts.find(
        (a) => a.getAttribute("is-open") === "true"
      );
      expect(openAlert).toBeDefined();
      expect(openAlert?.textContent).toContain(
        TRANSLATIONS.settings.sections.security.managepassword.page.alert
          .enablemessage
      );
    });

    act(() => {
      // Find the confirm button from the open alert
      const alerts = Array.from(
        document.querySelectorAll(
          '[data-testid="alert-cancel-enable-password"]'
        )
      ) as HTMLElement[];
      const openAlert = alerts.find(
        (a) => a.getAttribute("is-open") === "true"
      );
      const confirmButton = openAlert?.querySelector(
        '[data-testid="alert-cancel-enable-password-confirm-button"]'
      ) as HTMLElement;
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(
        queryByText(
          TRANSLATIONS.settings.sections.security.managepassword.page.alert
            .enablemessage
        )
      ).toBeNull();
    });

    await waitFor(() => {
      expect(getByText("1")).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(getByTestId("create-password-modal")).toBeVisible();
    });

    document.getElementsByTagName("html")[0].innerHTML = "";
  });

  test("Disable password option", async () => {
    jest.spyOn(Agent.agent.basicStorage, "findById").mockResolvedValue(
      new BasicRecord({
        id: "id",
        content: {
          value: "1213213",
        },
      })
    );

    const initialState = {
      stateCache: {
        routes: [RoutePath.GENERATE_SEED_PHRASE],
        currentProfileId: "default-profile-id",
        authentication: {
          loggedIn: false,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: true,
          seedPhraseIsSet: false,
        },
        currentOperation: OperationType.IDLE,
      },
    };

    const dispatchMock = jest.fn();
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { queryByTestId, getByTestId, queryByText, getByText } = render(
      <Provider store={storeMocked}>
        <ManagePassword />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("settings-item-toggle-password")).toBeVisible();
      expect(queryByTestId("settings-item-change-password")).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("settings-item-toggle-password"));
    });

    await waitFor(() => {
      expect(
        getByText(
          TRANSLATIONS.settings.sections.security.managepassword.page.alert
            .disablemessage
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("alert-cancel-confirm-button"));
    });

    await waitFor(() => {
      expect(
        queryByText(
          TRANSLATIONS.settings.sections.security.managepassword.page.alert
            .disablemessage
        )
      ).toBeNull();
    });

    await waitFor(() => {
      expect(getByTestId("verify-password-value")).toBeVisible();
      expect(getByTestId("forgot-hint-btn")).toBeVisible();
    });

    act(() => {
      ionFireEvent.ionInput(
        getByTestId("verify-password-value"),
        "Password@123"
      );
    });

    fireEvent.click(getByTestId("primary-button"));

    await waitFor(() => {
      expect(deletePasswordMock).toBeCalled();
    });
  });

  test("Change password", async () => {
    jest.spyOn(Agent.agent.basicStorage, "findById").mockResolvedValue(
      new BasicRecord({
        id: "id",
        content: {
          value: "1213213",
        },
      })
    );

    const initialState = {
      stateCache: {
        routes: [RoutePath.GENERATE_SEED_PHRASE],
        currentProfileId: "default-profile-id",
        authentication: {
          loggedIn: false,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: true,
          seedPhraseIsSet: false,
        },
        currentOperation: OperationType.IDLE,
      },
    };

    const dispatchMock = jest.fn();
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { queryByTestId, getByTestId } = render(
      <Provider store={storeMocked}>
        <ManagePassword />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("settings-item-toggle-password")).toBeVisible();
      expect(queryByTestId("settings-item-change-password")).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("settings-item-change-password"));
    });

    await waitFor(() => {
      expect(getByTestId("verify-password-value")).toBeVisible();
      expect(getByTestId("forgot-hint-btn")).toBeVisible();
    });

    act(() => {
      ionFireEvent.ionInput(
        getByTestId("verify-password-value"),
        "Password@123"
      );
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button"));
    });

    await waitFor(() => {
      expect(getByTestId("create-password-modal")).toBeVisible();
    });
  });
});
