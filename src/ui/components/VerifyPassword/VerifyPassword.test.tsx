const verifySecretMock = jest.fn();

import { IonInput } from "@ionic/react";
import { ionFireEvent } from "@ionic/react-test-utils";
import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { Agent } from "../../../core/agent/agent";
import { BasicRecord } from "../../../core/agent/records";
import { SecureStorage } from "../../../core/storage";
import ENG_Trans from "../../../locales/en/en.json";
import { credsFixAcdc } from "../../__fixtures__/credsFix";
import { TabsRoutePath } from "../../components/navigation/TabsMenu";
import { CustomInputProps } from "../CustomInput/CustomInput.types";
import { VerifyPassword } from "./VerifyPassword";

const path = TabsRoutePath.CREDENTIALS + "/" + credsFixAcdc[0].id;

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    id: credsFixAcdc[0].id,
  }),
  useRouteMatch: () => ({ url: path }),
}));

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      credentials: {
        getCredentialDetailsById: jest.fn(),
      },
      basicStorage: {
        findById: jest.fn(),
      },
      auth: {
        verifySecret: verifySecretMock,
      },
    },
  },
}));

const initialStateNoPassword = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: false,
      passwordIsSkipped: true,
    },
  },
  seedPhraseCache: {
    seedPhrase:
      "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
    bran: "bran",
  },
  credsCache: { creds: credsFixAcdc },
  credsArchivedCache: { creds: credsFixAcdc },
};

const initialStateWithPassword = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: true,
      passwordIsSkipped: false,
    },
    isOnline: true,
  },
  seedPhraseCache: {
    seedPhrase:
      "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
    bran: "bran",
  },
  credsCache: { creds: credsFixAcdc },
  credsArchivedCache: { creds: credsFixAcdc },
};

jest.mock("../CustomInput", () => ({
  CustomInput: (props: CustomInputProps) => {
    return (
      <IonInput
        data-testid={props.dataTestId}
        onIonInput={(e) => {
          props.onChangeInput(e.detail.value as string);
        }}
      />
    );
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children }: { children: any }) => children,
}));

describe("Verify Password", () => {
  let storeMocked: Store<unknown, AnyAction>;
  beforeEach(() => {
    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    storeMocked = {
      ...mockStore(initialStateNoPassword),
      dispatch: dispatchMock,
    };
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("Verify failed", async () => {
    verifySecretMock.mockResolvedValue(false);
    jest.spyOn(Agent.agent.basicStorage, "findById").mockResolvedValue(
      new BasicRecord({
        id: "id",
        content: {
          value: "1213213",
        },
      })
    );

    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    storeMocked = {
      ...mockStore(initialStateWithPassword),
      dispatch: dispatchMock,
    };

    const setIsOpenMock = jest.fn();
    const onVerifyMock = jest.fn();

    const { findByTestId, getByTestId } = render(
      <Provider store={storeMocked}>
        <VerifyPassword
          isOpen={true}
          setIsOpen={setIsOpenMock}
          onVerify={onVerifyMock}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("forgot-hint-btn")).toBeVisible();
    });

    const passwordInput = await findByTestId("verify-password-value");

    const confirmButton = await findByTestId("primary-button");

    act(() => {
      ionFireEvent.ionInput(passwordInput, "1111");
    });

    act(() => {
      ionFireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(getByTestId("error-message")).toBeVisible();
    });
  });

  test("Verify success", async () => {
    verifySecretMock.mockResolvedValue(true);
    jest.spyOn(SecureStorage, "get").mockResolvedValue("1111");
    jest.spyOn(Agent.agent.basicStorage, "findById").mockResolvedValue(
      new BasicRecord({
        id: "id",
        content: {
          value: "1213213",
        },
      })
    );

    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    storeMocked = {
      ...mockStore(initialStateWithPassword),
      dispatch: dispatchMock,
    };

    const setIsOpenMock = jest.fn();
    const onVerifyMock = jest.fn();

    const { getByTestId, unmount } = render(
      <Provider store={storeMocked}>
        <VerifyPassword
          isOpen={true}
          setIsOpen={setIsOpenMock}
          onVerify={onVerifyMock}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("forgot-hint-btn")).toBeVisible();
    });

    const passwordInput = getByTestId("verify-password-value");
    const confirmButton = getByTestId("primary-button");

    act(() => {
      ionFireEvent.ionInput(passwordInput, "1111");
    });

    act(() => {
      ionFireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(onVerifyMock).toBeCalledTimes(1);
    });

    unmount();
  });

  test("Render hint button success", async () => {
    jest.spyOn(Agent.agent.basicStorage, "findById").mockResolvedValue(
      Promise.resolve({
        content: {
          value: "1111",
        },
      } as any)
    );

    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    storeMocked = {
      ...mockStore(initialStateWithPassword),
      dispatch: dispatchMock,
    };

    const setIsOpenMock = jest.fn();
    const onVerifyMock = jest.fn();

    const { getByTestId, getByText, queryByText } = render(
      <Provider store={storeMocked}>
        <VerifyPassword
          isOpen={true}
          setIsOpen={setIsOpenMock}
          onVerify={onVerifyMock}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("forgot-hint-btn")).toBeVisible();
    });

    fireEvent.click(getByTestId("forgot-hint-btn"));

    await waitFor(() => {
      expect(
        getByText(ENG_Trans.verifypassword.alert.choice.title)
      ).toBeVisible();
    });

    fireEvent.click(
      getByText(ENG_Trans.verifypassword.alert.button.seepasswordhint)
    );

    await waitFor(() => {
      expect(
        getByText(ENG_Trans.verifypassword.alert.hint.title)
      ).toBeVisible();
    });

    fireEvent.click(getByTestId("alert-tryagain-confirm-button"));

    await waitFor(() => {
      expect(queryByText(ENG_Trans.verifypassword.alert.hint.title)).toBeNull();
    });
  });

  test("Recovery password", async () => {
    jest.spyOn(Agent.agent.basicStorage, "findById").mockResolvedValue(
      Promise.resolve({
        content: {
          value: "1111",
        },
      } as any)
    );

    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    storeMocked = {
      ...mockStore(initialStateWithPassword),
      dispatch: dispatchMock,
    };

    const setIsOpenMock = jest.fn();
    const onVerifyMock = jest.fn();

    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <VerifyPassword
          isOpen={true}
          setIsOpen={setIsOpenMock}
          onVerify={onVerifyMock}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("forgot-hint-btn")).toBeVisible();
    });

    fireEvent.click(getByTestId("forgot-hint-btn"));

    await waitFor(() => {
      expect(
        getByText(ENG_Trans.verifypassword.alert.choice.title)
      ).toBeVisible();
    });

    fireEvent.click(
      getByText(ENG_Trans.verifypassword.alert.button.seepasswordhint)
    );

    await waitFor(() => {
      expect(
        getByText(ENG_Trans.verifypassword.alert.hint.title)
      ).toBeVisible();
    });

    fireEvent.click(getByTestId("alert-tryagain-secondary-confirm-button"));

    await waitFor(() => {
      expect(getByText(ENG_Trans.forgotauth.password.title)).toBeVisible();
    });
  });

  test("Close verify password", async () => {
    jest.spyOn(Agent.agent.basicStorage, "findById").mockResolvedValue(
      Promise.resolve({
        content: {
          value: "1111",
        },
      } as any)
    );

    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    storeMocked = {
      ...mockStore(initialStateWithPassword),
      dispatch: dispatchMock,
    };

    const setIsOpenMock = jest.fn();
    const onVerifyMock = jest.fn();

    const { getByTestId, getAllByTestId } = render(
      <Provider store={storeMocked}>
        <VerifyPassword
          isOpen={true}
          setIsOpen={setIsOpenMock}
          onVerify={onVerifyMock}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("forgot-hint-btn")).toBeVisible();
    });

    const closeButtons = getAllByTestId("close-button");
    const enabledClose = closeButtons.find(
      (btn) => !btn.hasAttribute("disabled")
    );
    if (!enabledClose) {
      throw new Error("No enabled close button found");
    }
    fireEvent.click(enabledClose);

    await waitFor(() => {
      expect(setIsOpenMock).toBeCalled();
    });
  });
});
