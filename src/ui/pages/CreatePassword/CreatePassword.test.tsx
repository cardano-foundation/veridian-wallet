import { IonButton, IonIcon, IonInput, IonLabel } from "@ionic/react";
import { IonReactMemoryRouter } from "@ionic/react-router";
import { ionFireEvent } from "@ionic/react-test-utils";
import {
  fireEvent,
  queryByText,
  render,
  waitFor,
} from "@testing-library/react";
import { act } from "react";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import configureStore from "redux-mock-store";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { RoutePath } from "../../../routes";
import { TabsRoutePath } from "../../../routes/paths";
import {
  setCurrentOperation,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import { CustomInputProps } from "../../components/CustomInput/CustomInput.types";
import { OperationType, ToastMsgType } from "../../globals/types";
import { CreatePassword } from "./CreatePassword";
import { BasicRecord } from "../../../core/agent/records";
import { MiscRecordId } from "../../../core/agent/agent.types";

jest.mock("../../components/CustomInput", () => ({
  CustomInput: (props: CustomInputProps) => {
    return (
      <>
        <IonLabel
          position="stacked"
          data-testid={`${props.title
            ?.toLowerCase()
            .replace(/\s/g, "-")}-input-title`}
        >
          {props.title}
          {props.optional && (
            <span className="custom-input-optional">(optional)</span>
          )}
          {props.labelAction}
        </IonLabel>
        <IonInput
          data-testid={props.dataTestId}
          onIonInput={(e) => {
            props.onChangeInput(e.detail.value as string);
          }}
          onIonFocus={() => props.onChangeFocus?.(true)}
          onIonBlur={() => props.onChangeFocus?.(false)}
        />
        {props.action && props.actionIcon && (
          <IonButton
            shape="round"
            data-testid={`${props.dataTestId}-action`}
            onClick={(e) => {
              props.action?.(e);
            }}
          >
            <IonIcon
              slot="icon-only"
              icon={props.actionIcon}
              color="primary"
            />
          </IonButton>
        )}
      </>
    );
  },
}));

const createOrUpdateBasicRecordMock = jest.fn((_: unknown) =>
  Promise.resolve(true)
);
jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
        createOrUpdateBasicRecord: (arg: unknown) =>
          createOrUpdateBasicRecordMock(arg),
      },
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
        storeSecret: jest.fn(),
      },
    },
  },
}));

const secureStorageDeleteFunc = jest.fn();

jest.mock("../../../core/storage", () => ({
  ...jest.requireActual("../../../core/storage"),
  SecureStorage: {
    delete: (...args: unknown[]) => secureStorageDeleteFunc(...args),
  },
}));

describe("Create Password Page", () => {
  describe("Renders Create Password page when Onboarding", () => {
    const initialStateNoPassword = {
      stateCache: {
        routes: [{ path: RoutePath.CREATE_PASSWORD }],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: false,
        },
        toastMsgs: [],
      },
    };

    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    const storeMocked = {
      ...mockStore(initialStateNoPassword),
      dispatch: dispatchMock,
    };

    test("Render", async () => {
      const path = RoutePath.CREATE_PASSWORD;

      const { getByTestId, queryByTestId, getByText } = render(
        <Provider store={storeMocked}>
          <MemoryRouter initialEntries={[path]}>
            <Route
              path={path}
              component={CreatePassword}
            />
          </MemoryRouter>
        </Provider>
      );

      expect(
        getByText(EN_TRANSLATIONS.createpassword.setuppassword.title)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.createpassword.setuppassword.description)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.createpassword.setuppassword.button.enable)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.createpassword.setuppassword.button.skip)
      ).toBeVisible();

      fireEvent.click(
        getByText(EN_TRANSLATIONS.createpassword.setuppassword.button.enable)
      );

      await waitFor(() => {
        expect(getByTestId("progress-bar")).toBeInTheDocument();
      });

      expect(queryByTestId("close-button")).not.toBeInTheDocument();
      expect(getByTestId("create-password-title")).toBeInTheDocument();
      expect(getByTestId("create-password-title")).toHaveTextContent(
        EN_TRANSLATIONS.createpassword.title
      );
      expect(getByTestId("create-password-top-paragraph")).toBeInTheDocument();
      expect(getByTestId("create-password-top-paragraph")).toHaveTextContent(
        EN_TRANSLATIONS.createpassword.description
      );
      expect(getByTestId("create-password-input-title")).toBeInTheDocument();
      expect(getByTestId("create-password-input-title")).toHaveTextContent(
        EN_TRANSLATIONS.createpassword.input.first.title
      );
      expect(getByTestId("confirm-password-input-title")).toBeInTheDocument();
      expect(getByTestId("confirm-password-input-title")).toHaveTextContent(
        EN_TRANSLATIONS.createpassword.input.second.title
      );
      expect(getByTestId("create-a-hint-input-title")).toBeInTheDocument();
      expect(getByTestId("create-a-hint-input-title")).toHaveTextContent(
        EN_TRANSLATIONS.createpassword.input.third.title
      );
      expect(getByTestId("primary-button-create-password")).toBeInTheDocument();
      expect(getByTestId("primary-button-create-password")).toHaveTextContent(
        EN_TRANSLATIONS.createpassword.button.continue
      );
    });
    test("User Action: Skip on setup page", async () => {
      const handleClear = jest.fn();
      const setPasswordIsSet = jest.fn();

      const history = createMemoryHistory();
      history.push(RoutePath.CREATE_PASSWORD);

      const { getByText, findByText, queryByText } = render(
        <IonReactMemoryRouter
          initialEntries={[RoutePath.CREATE_PASSWORD]}
          history={history}
        >
          <Provider store={storeMocked}>
            <CreatePassword
              handleClear={handleClear}
              setPasswordIsSet={setPasswordIsSet}
            />
          </Provider>
        </IonReactMemoryRouter>
      );

      expect(
        getByText(EN_TRANSLATIONS.createpassword.setuppassword.button.skip)
      ).toBeVisible();

      fireEvent.click(
        getByText(EN_TRANSLATIONS.createpassword.setuppassword.button.skip)
      );

      const alertTitle = await findByText(
        EN_TRANSLATIONS.createpassword.alert.text
      );

      await waitFor(() => {
        expect(alertTitle).toBeVisible();
      });

      const mockDate = new Date(1466424490000);
      const spy = jest
        .spyOn(global, "Date")
        .mockImplementation((() => mockDate) as never);

      act(() => {
        fireEvent.click(
          getByText(EN_TRANSLATIONS.createpassword.alert.button.confirm)
        );
      });

      await waitFor(() => {
        expect(
          queryByText(EN_TRANSLATIONS.createpassword.alert.text)
        ).toBeNull();
      });

      await waitFor(() => {
        expect(createOrUpdateBasicRecordMock).toBeCalledWith(
          new BasicRecord({
            id: MiscRecordId.APP_PASSWORD_SKIPPED,
            content: { value: true },
          })
        );
      });

      spy.mockRestore();
    });

    test("Submit password", async () => {
      const handleClear = jest.fn();
      const setPasswordIsSet = jest.fn();

      const history = createMemoryHistory();
      history.push(RoutePath.CREATE_PASSWORD);

      const { getByTestId, getByText } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <CreatePassword
              handleClear={handleClear}
              setPasswordIsSet={setPasswordIsSet}
            />
          </Provider>
        </IonReactMemoryRouter>
      );

      fireEvent.click(
        getByText(EN_TRANSLATIONS.createpassword.setuppassword.button.enable)
      );

      await waitFor(() => {
        expect(getByTestId("progress-bar")).toBeInTheDocument();
      });

      const input = getByTestId("create-password-input");
      const confirmInput = getByTestId("confirm-password-input");
      const hintInput = getByTestId("create-hint-input");

      act(() => {
        ionFireEvent.ionInput(input, "Passsssss1@");
        ionFireEvent.ionInput(confirmInput, "Passsssss1@");
        ionFireEvent.ionInput(hintInput, "hint");
      });

      const submitButton = getByTestId("primary-button-create-password");

      act(() => {
        ionFireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(dispatchMock).toBeCalledWith(
          setCurrentOperation(OperationType.IDLE)
        );
      });
    });
  });

  describe("Renders Create Password page when manage password", () => {
    const initialStateWithPassword = {
      stateCache: {
        routes: [{ path: TabsRoutePath.MENU }],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: false,
        },
      },
    };

    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    const storeMocked = {
      ...mockStore(initialStateWithPassword),
      dispatch: dispatchMock,
    };

    test("User Action: Change", async () => {
      const handleClear = jest.fn();
      const setPasswordIsSet = jest.fn();
      const { getByTestId, queryByTestId } = render(
        <Provider store={storeMocked}>
          <CreatePassword
            handleClear={handleClear}
            setPasswordIsSet={setPasswordIsSet}
            userAction={{
              current: "change",
            }}
          />
        </Provider>
      );

      expect(queryByTestId("progress-bar")).toBe(null);
      expect(queryByTestId("close-button")).toBeInTheDocument();
      expect(queryByTestId("create-password-title")).toBe(null);
      expect(
        getByTestId(
          `${EN_TRANSLATIONS.createpassword.change
            .trim()
            .replace(/[^aA-zZ\s]/, "")
            .split(" ")
            .join("-")
            .toLowerCase()}-title`
        )
      ).toHaveTextContent(EN_TRANSLATIONS.createpassword.change);
      expect(getByTestId("create-password-top-paragraph")).toBeInTheDocument();
      expect(getByTestId("create-password-top-paragraph")).toHaveTextContent(
        EN_TRANSLATIONS.createpassword.description
      );

      const input = getByTestId("create-password-input");
      const confirmInput = getByTestId("confirm-password-input");
      const hintInput = getByTestId("create-hint-input");

      act(() => {
        ionFireEvent.ionInput(input, "Passsssss1@");
        ionFireEvent.ionInput(confirmInput, "Passsssss1@");
        ionFireEvent.ionInput(hintInput, "hint");
      });

      const submitButton = getByTestId("primary-button-create-password");

      act(() => {
        ionFireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(dispatchMock).toBeCalledWith(
          setToastMsg(ToastMsgType.PASSWORD_UPDATED)
        );
      });
    });

    test("User Action: enable", async () => {
      const handleClear = jest.fn();
      const setPasswordIsSet = jest.fn();
      const { getByTestId, queryByTestId } = render(
        <Provider store={storeMocked}>
          <CreatePassword
            handleClear={handleClear}
            setPasswordIsSet={setPasswordIsSet}
            userAction={{
              current: "enable",
            }}
          />
        </Provider>
      );

      expect(queryByTestId("progress-bar")).toBe(null);
      expect(queryByTestId("close-button")).toBeInTheDocument();
      expect(
        getByTestId(
          `${EN_TRANSLATIONS.createpassword.title
            .trim()
            .replace(/[^aA-zZ\s]/, "")
            .split(" ")
            .join("-")
            .toLowerCase()}-title`
        )
      ).toHaveTextContent(EN_TRANSLATIONS.createpassword.title);
      expect(getByTestId("create-password-top-paragraph")).toBeInTheDocument();
      expect(getByTestId("create-password-top-paragraph")).toHaveTextContent(
        EN_TRANSLATIONS.createpassword.description
      );

      const input = getByTestId("create-password-input");
      const confirmInput = getByTestId("confirm-password-input");
      const hintInput = getByTestId("create-hint-input");

      act(() => {
        ionFireEvent.ionInput(input, "Passsssss1@");
        ionFireEvent.ionInput(confirmInput, "Passsssss1@");
        ionFireEvent.ionInput(hintInput, "hint");
      });

      const submitButton = getByTestId("primary-button-create-password");

      act(() => {
        ionFireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(dispatchMock).toBeCalledWith(
          setToastMsg(ToastMsgType.PASSWORD_CREATED)
        );
      });
    });
  });

  test("Hidden skip button", async () => {
    const initialStateNoPassword = {
      stateCache: {
        routes: [{ path: RoutePath.TABS_MENU }],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: false,
        },
        toastMsgs: [],
      },
    };

    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    const storeMocked = {
      ...mockStore(initialStateNoPassword),
      dispatch: dispatchMock,
    };

    const handleClear = jest.fn();
    const setPasswordIsSet = jest.fn();
    const { queryByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <CreatePassword
            handleClear={handleClear}
            setPasswordIsSet={setPasswordIsSet}
            userAction={{
              current: "enable",
            }}
          />
        </Provider>
      </MemoryRouter>
    );

    expect(queryByText(EN_TRANSLATIONS.createpassword.button.skip)).toBeNull();
  });
});
