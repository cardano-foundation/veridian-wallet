import { mockIonicReact } from "@ionic/react-test-utils";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import { makeTestStore } from "../../utils/makeTestStore";
import { Profiles } from "./Profiles";
import { Agent } from "../../../core/agent/agent";
import { setToastMsg } from "../../../store/reducers/stateCache";
import { ToastMsgType } from "../../globals/types";
mockIonicReact();

jest.mock("../../../core/configuration", () => ({
  ...jest.requireActual("../../../core/configuration"),
  ConfigurationService: {
    env: {
      features: {
        notifications: {
          fallbackIcon: false,
        },
      },
    },
  },
}));

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        createOrUpdateBasicRecord: jest.fn(),
      },
    },
  },
}));

const dispatchMock = jest.fn();
const initialState = {
  stateCache: {
    routes: [TabsRoutePath.NOTIFICATIONS],
    currentProfile: filteredIdentifierFix[0].id,
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
  },
  identifiersCache: {
    identifiers: filteredIdentifierFix,
  },
  connectionsCache: {
    connections: {},
  },
  notificationsCache: {
    notifications: [],
  },
  biometricsCache: {
    enabled: false,
  },
};

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

describe("Profiles", () => {
  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  afterEach(() => {
    cleanup();
  });

  test("Render profile", async () => {
    const setIsOpenMock = jest.fn();
    const { getByText } = render(
      <Provider store={storeMocked}>
        <Profiles
          isOpen
          setIsOpen={setIsOpenMock}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.profiles.title)).toBeInTheDocument();
    });

    expect(getByText(EN_TRANSLATIONS.profiles.cancel)).toBeInTheDocument();
    expect(getByText(EN_TRANSLATIONS.profiles.options.add)).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.profiles.options.join)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.profiles.options.manage)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.profiles.options.settings)
    ).toBeInTheDocument();

    fireEvent.click(getByText(EN_TRANSLATIONS.profiles.cancel));

    await waitFor(() => {
      expect(setIsOpenMock).toBeCalled();
    });
  });

  test("switch profile success", async () => {
    const setIsOpenMock = jest.fn();
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <Profiles
          isOpen
          setIsOpen={setIsOpenMock}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.profiles.title)).toBeInTheDocument();
    });

    fireEvent.click(
      getByTestId(`profiles-list-item-${filteredIdentifierFix[1].id}`)
    );

    await waitFor(() => {
      expect(Agent.agent.basicStorage.createOrUpdateBasicRecord).toBeCalled();
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.PROFILE_SWITCHED)
      );
    });
  });

  test("switch profile fail", async () => {
    const setIsOpenMock = jest.fn();
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <Profiles
          isOpen
          setIsOpen={setIsOpenMock}
        />
      </Provider>
    );

    jest
      .spyOn(Agent.agent.basicStorage, "createOrUpdateBasicRecord")
      .mockRejectedValue(new Error("error"));

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.profiles.title)).toBeInTheDocument();
    });

    fireEvent.click(
      getByTestId(`profiles-list-item-${filteredIdentifierFix[1].id}`)
    );

    await waitFor(() => {
      expect(Agent.agent.basicStorage.createOrUpdateBasicRecord).toBeCalled();
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.UNABLE_TO_SWITCH_PROFILE)
      );
    });
  });
});
