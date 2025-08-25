import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { store } from "../../../../../store";
import { connectionsFix } from "../../../../__fixtures__/connectionsFix";
import { shortCredsFix } from "../../../../__fixtures__/shortCredsFix";
import { TabsRoutePath } from "../../../navigation/TabsMenu";
import { KeriCardTemplate } from "./KeriCardTemplate";
import { makeTestStore } from "../../../../utils/makeTestStore";

const firstConnId = connectionsFix[0].id as string;

const storeState = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: false,
      passwordIsSkipped: true,
    },
    isOnline: true,
  },
  seedPhraseCache: {
    seedPhrase:
      "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
    bran: "bran",
  },
  biometricsCache: {
    enabled: false,
  },
  profilesCache: {
    profiles: {
      [firstConnId]: {
        identity: {
          id: firstConnId,
          displayName: connectionsFix[0].label,
          createdAtUTC: "2000-01-01T00:00:00.000Z",
        },
        connections: [connectionsFix[0]],
        multisigConnections: [],
        peerConnections: [],
        credentials: [],
        archivedCredentials: [],
        notifications: [],
      },
    },
    defaultProfile: firstConnId,
  },
};

const dispatchMock = jest.fn();
const storeMocked = {
  ...makeTestStore(storeState),
  dispatch: dispatchMock,
};

describe("KeriCardTemplate", () => {
  it("renders Keri Card Template", async () => {
    const handleShowCardDetails = jest.fn();
    const { getByText, getByTestId, getByAltText } = render(
      <Provider store={storeMocked}>
        <KeriCardTemplate
          name="name"
          index={0}
          cardData={shortCredsFix[3]}
          isActive={true}
          onHandleShowCardDetails={() => handleShowCardDetails(0)}
        />
      </Provider>
    );
    const card = getByTestId("keri-card-template-name-index-0");
    expect(getByText("Qualified vLEI Issuer Credential")).toBeInTheDocument();
    expect(getByText(connectionsFix[0].label)).toBeInTheDocument();
    expect(getByText("22/01/2024")).toBeInTheDocument();
    expect(getByAltText(/card-logo/i)).toBeInTheDocument();
    act(() => {
      fireEvent.click(card);
    });
    expect(handleShowCardDetails).toBeCalledTimes(1);
  });

  it("Click pending card", async () => {
    const handleShowCardDetails = jest.fn();
    const { getByTestId } = render(
      <Provider store={store}>
        <KeriCardTemplate
          name="name"
          index={0}
          cardData={shortCredsFix[4]}
          isActive={true}
          onHandleShowCardDetails={() => handleShowCardDetails(0)}
        />
      </Provider>
    );
    const card = getByTestId("keri-card-template-name-index-0");

    act(() => {
      fireEvent.click(card);
    });

    expect(handleShowCardDetails).toBeCalledTimes(0);

    await waitFor(() => {
      expect(getByTestId("alert-confirm")).toBeInTheDocument();
    });
  });

  it("In active card status", async () => {
    const handleShowCardDetails = jest.fn();
    const { getByTestId } = render(
      <Provider store={store}>
        <KeriCardTemplate
          name="name"
          index={0}
          cardData={shortCredsFix[4]}
          isActive={false}
          onHandleShowCardDetails={() => handleShowCardDetails(0)}
        />
      </Provider>
    );
    const card = getByTestId("keri-card-template-name-index-0");

    expect(card.classList.contains("active")).toBe(false);
  });
});
