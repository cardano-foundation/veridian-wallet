import { IonInput, IonLabel } from "@ionic/react";
import { ionFireEvent } from "@ionic/react-test-utils";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { Agent } from "../../../core/agent/agent";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import {
  setAuthentication,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import { ToastMsgType } from "../../globals/types";
import { CustomInputProps } from "../CustomInput/CustomInput.types";
import { InputRequest } from "./InputRequest";
import { StorageMessage } from "../../../core/storage/storage.types";
import { setOpenConnectionId } from "../../../store/reducers/connectionsCache";
import { identifierFix } from "../../__fixtures__/identifierFix";

const connectByOobiUrl = jest.fn();
jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      credentials: {
        getCredentialDetailsById: jest.fn(),
      },
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
        createOrUpdateBasicRecord: jest.fn(() => {
          return Promise.resolve(true);
        }),
      },
      connections: {
        connectByOobiUrl: (url: string) => connectByOobiUrl(url),
      },
    },
  },
}));

jest.mock("../CustomInput", () => ({
  CustomInput: (props: CustomInputProps) => {
    return (
      <>
        <IonLabel
          position="stacked"
          data-testid={`${props.title?.toLowerCase().replace(" ", "-")}-title`}
        >
          {props.title}
          {props.optional && (
            <span className="custom-input-optional">(optional)</span>
          )}
        </IonLabel>
        <IonInput
          data-testid={props.dataTestId}
          onIonInput={(e) => {
            props.onChangeInput(e.detail.value as string);
          }}
          value={props.value}
        />
      </>
    );
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children }: { children: any }) => children,
}));

jest.mock("signify-ts", () => ({
  Salter: jest.fn().mockImplementation(() => {
    return { qb64: "" };
  }),
}));

describe("SetUserName component", () => {
  const mockStore = configureStore();
  const dispatchMock = jest.fn();
  const initialState = {
    stateCache: {
      routes: ["/"],
      authentication: {
        loggedIn: true,
        time: 0,
        passcodeIsSet: true,
        seedPhraseIsSet: true,
        passwordIsSet: false,
        passwordIsSkipped: true,
        ssiAgentIsSet: true,
        ssiAgentUrl: "http://keria.com",
        recoveryWalletProgress: false,
        loginAttempt: {
          attempts: 0,
          lockedUntil: 0,
        },
        firstAppLaunch: true,
      },
    },
    connectionsCache: {
      connections: connectionsFix,
    },
    identifiersCache: {
      identifiers: filteredIdentifierFix,
      favourites: [],
    },
  };

  const storeMocked = {
    ...mockStore(initialState),
    dispatch: dispatchMock,
  };

  test("It renders modal successfully", async () => {
    const { getByText } = render(
      <Provider store={storeMocked}>
        <InputRequest />
      </Provider>
    );
    expect(
      getByText(EN_TRANSLATIONS.inputrequest.title.username)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.inputrequest.button.confirm)
    ).toBeVisible();
  });

  test("Disable CTA if username is space", async () => {
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <InputRequest />
      </Provider>
    );

    act(() => {
      ionFireEvent.ionInput(getByTestId("input-request-input"), " ");
    });

    expect(
      getByTestId("primary-button-input-request").getAttribute("disabled")
    ).toBe("true");
  });

  test("It should call handleConfirm when the primary button is clicked", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <InputRequest />
      </Provider>
    );

    act(() => {
      ionFireEvent.ionInput(getByTestId("input-request-input"), "testUser");
    });

    await waitFor(() => {
      expect(
        (getByTestId("input-request-input") as HTMLInputElement).value
      ).toBe("testUser");
    });

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATIONS.inputrequest.button.confirm));
    });

    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledWith(
        setAuthentication({
          loggedIn: true,
          time: 0,
          passcodeIsSet: true,
          seedPhraseIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: true,
          ssiAgentIsSet: true,
          ssiAgentUrl: "http://keria.com",
          recoveryWalletProgress: false,
          loginAttempt: {
            attempts: 0,
            lockedUntil: 0,
          },
          firstAppLaunch: true,
          userName: "testUser",
          defaultProfile: "",
        })
      );
    });

    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledWith(
        setToastMsg(ToastMsgType.USERNAME_CREATION_SUCCESS)
      );
    });
  });

  test("Display toast error message", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <InputRequest />
      </Provider>
    );

    act(() => {
      ionFireEvent.ionInput(getByTestId("input-request-input"), "testUser");
    });

    await waitFor(() => {
      expect(
        (getByTestId("input-request-input") as HTMLInputElement).value
      ).toBe("testUser");
    });

    jest
      .spyOn(Agent.agent.basicStorage, "createOrUpdateBasicRecord")
      .mockImplementation(() => {
        return Promise.reject("Error");
      });

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATIONS.inputrequest.button.confirm));
    });

    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledWith(
        setToastMsg(ToastMsgType.USERNAME_CREATION_ERROR)
      );
    });
  });

  test("Display validate error message", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <InputRequest />
      </Provider>
    );

    act(() => {
      ionFireEvent.ionInput(getByTestId("input-request-input"), "");
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.nameerror.onlyspace)).toBeVisible();
    });

    act(() => {
      ionFireEvent.ionInput(getByTestId("input-request-input"), "   ");
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.nameerror.onlyspace)).toBeVisible();
    });

    act(() => {
      ionFireEvent.ionInput(
        getByTestId("input-request-input"),
        "Duke Duke Duke Duke  Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke"
      );
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.nameerror.maxlength)).toBeVisible();
    });

    act(() => {
      ionFireEvent.ionInput(getByTestId("input-request-input"), "Duke@@");
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.nameerror.hasspecialchar)).toBeVisible();
    });
  });
});

describe("Set connection alias", () => {
  const mockStore = configureStore();
  const dispatchMock = jest.fn();
  const initialState = {
    stateCache: {
      routes: ["/"],
      authentication: {
        loggedIn: true,
        time: 0,
        passcodeIsSet: true,
        seedPhraseIsSet: true,
        passwordIsSet: false,
        passwordIsSkipped: true,
        ssiAgentIsSet: true,
        ssiAgentUrl: "http://keria.com",
        recoveryWalletProgress: false,
        loginAttempt: {
          attempts: 0,
          lockedUntil: 0,
        },
      },
    },
    connectionsCache: {
      connections: connectionsFix,
      missingAliasUrl: {
        url: "http://keria:3902/oobi/EJ0XanWANawPeyCzyPxAbilMId9FNHY8eobED84Gxfij/agent/ENmmQwmKjO7UQdRMGd2STVUvjV8y1sKCkg1Wc_QvpZU3",
        identifier: identifierFix[0].id,
      },
    },
  };

  const storeMocked = {
    ...mockStore(initialState),
    dispatch: dispatchMock,
  };

  test("render", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <InputRequest />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.inputrequest.title.connectionalias)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.inputrequest.button.confirm)
    ).toBeVisible();

    act(() => {
      ionFireEvent.ionInput(
        getByTestId("input-request-input"),
        "connectionName"
      );
    });

    await waitFor(() => {
      expect(
        (getByTestId("input-request-input") as HTMLInputElement).value
      ).toBe("connectionName");
    });

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATIONS.inputrequest.button.confirm));
    });

    await waitFor(() => {
      expect(connectByOobiUrl).toBeCalledWith(
        "http://keria:3902/oobi/EJ0XanWANawPeyCzyPxAbilMId9FNHY8eobED84Gxfij/agent/ENmmQwmKjO7UQdRMGd2STVUvjV8y1sKCkg1Wc_QvpZU3?name=connectionName"
      );
    });
  });

  test("create connection failed", async () => {
    connectByOobiUrl.mockImplementation(() =>
      Promise.reject(
        new Error(`${StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG} mockId`)
      )
    );

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <InputRequest />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.inputrequest.title.connectionalias)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.inputrequest.button.confirm)
    ).toBeVisible();

    act(() => {
      ionFireEvent.ionInput(
        getByTestId("input-request-input"),
        "connectionName"
      );
    });

    await waitFor(() => {
      expect(
        (getByTestId("input-request-input") as HTMLInputElement).value
      ).toBe("connectionName");
    });

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATIONS.inputrequest.button.confirm));
    });

    await waitFor(() => {
      expect(connectByOobiUrl).toBeCalledWith(
        "http://keria:3902/oobi/EJ0XanWANawPeyCzyPxAbilMId9FNHY8eobED84Gxfij/agent/ENmmQwmKjO7UQdRMGd2STVUvjV8y1sKCkg1Wc_QvpZU3?name=connectionName"
      );
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.DUPLICATE_CONNECTION)
      );
      expect(dispatchMock).toBeCalledWith(setOpenConnectionId("mockId"));
    });
  });
});
