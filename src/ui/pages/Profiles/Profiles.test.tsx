import { mockIonicReact } from "@ionic/react-test-utils";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import {
  filteredIdentifierFix,
  filteredIdentifierMapFix,
} from "../../__fixtures__/filteredIdentifierFix";
import { makeTestStore } from "../../utils/makeTestStore";
import { Profiles } from "./Profiles";
import { Agent } from "../../../core/agent/agent";
import {
  setToastMsg,
  updateCurrentProfile,
} from "../../../store/reducers/stateCache";
import { ToastMsgType } from "../../globals/types";
import { CreationStatus } from "../../../core/agent/agent.types";

jest.mock("../../../store/reducers/stateCache", () => ({
  ...jest.requireActual("../../../store/reducers/stateCache"),
  updateCurrentProfile: jest.fn(),
}));
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
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      defaultProfile: "",
    },
    currentProfile: {
      identity: filteredIdentifierFix[0],
      connections: [],
      multisigConnections: [],
      peerConnections: [],
      credentials: [],
      archivedCredentials: [],
    },
  },
  identifiersCache: {
    identifiers: filteredIdentifierMapFix,
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
    jest.clearAllMocks();
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
    (
      Agent.agent.basicStorage.createOrUpdateBasicRecord as jest.Mock
    ).mockResolvedValue(undefined);
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

    (
      Agent.agent.basicStorage.createOrUpdateBasicRecord as jest.Mock
    ).mockRejectedValue(new Error("error"));

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

  test("shows IonChip for identifier with creationStatus PENDING", async () => {
    const setIsOpenMock = jest.fn();
    const pendingIdentifier = filteredIdentifierFix.find(
      (idObj) => idObj.creationStatus === CreationStatus.PENDING
    );
    if (!pendingIdentifier) {
      throw new Error(
        "No identifier with creationStatus PENDING found in fixture"
      );
    }

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <Profiles
          isOpen
          setIsOpen={setIsOpenMock}
        />
      </Provider>
    );

    const chip = await waitFor(() =>
      getByTestId(`profiles-list-item-${pendingIdentifier.id}-status`)
    );
    expect(chip).toBeVisible();
    expect(chip.textContent?.toLowerCase()).toContain(
      CreationStatus.PENDING.toLowerCase()
    );
  });
});
