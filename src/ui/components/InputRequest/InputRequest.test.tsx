import { IonInput, IonLabel } from "@ionic/react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { StorageMessage } from "../../../core/storage/storage.types";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { setOpenConnectionId } from "../../../store/reducers/profileCache";
import { setToastMsg } from "../../../store/reducers/stateCache";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import { identifierFix } from "../../__fixtures__/identifierFix";
import { ToastMsgType } from "../../globals/types";
import { CustomInputProps } from "../CustomInput/CustomInput.types";
import { InputRequest } from "./InputRequest";
import { makeTestStore } from "../../utils/makeTestStore";

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

describe("Set connection alias", () => {
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
    // use profilesCache shape for connections
    profilesCache: {
      defaultProfile: identifierFix[0].id,
      profiles: {
        [identifierFix[0].id]: {
          identity: identifierFix[0],
          connections: connectionsFix,
          multisigConnections: [],
          peerConnections: [],
          credentials: [],
          archivedCredentials: [],
        },
      },
      missingAliasUrl: {
        url: "http://keria:3902/oobi/EJ0XanWANawPeyCzyPxAbilMId9FNHY8eobED84Gxfij/agent/ENmmQwmKjO7UQdRMGd2STVUvjV8y1sKCkg1Wc_QvpZU3",
        identifier: identifierFix[0].id,
      },
    },
  };

  const storeMocked = {
    ...makeTestStore(initialState),
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
      fireEvent(
        getByTestId("input-request-input"),
        new CustomEvent("ionInput", {
          detail: { value: "connectionName" },
        })
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
      fireEvent(
        getByTestId("input-request-input"),
        new CustomEvent("ionInput", {
          detail: { value: "connectionName" },
        })
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
