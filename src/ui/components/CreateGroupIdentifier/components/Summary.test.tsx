import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { CreationStatus } from "../../../../core/agent/agent.types";
import EN_TRANSLATIONS from "../../../../locales/en/en.json";
import { store } from "../../../../store";
import { setToastMsg } from "../../../../store/reducers/stateCache";
import { connectionsFix } from "../../../__fixtures__/connectionsFix";
import { ToastMsgType } from "../../../globals/types";
import { IdentifierColor } from "../../EditProfile/components/IdentifierColorSelector";
import { Stage } from "../CreateGroupIdentifier.types";
import { Summary } from "./Summary";
import { makeTestStore } from "../../../utils/makeTestStore";

const createGroupMock = jest.fn();

jest.mock("../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      multiSigs: {
        createGroup: (...args: any) => createGroupMock(...args),
      },
    },
  },
}));

describe("Create group identifier - Summary", () => {
  const stage4State = {
    identifierCreationStage: 4,
    displayNameValue: "Duke",
    selectedAidType: 0,
    selectedTheme: 0,
    threshold: 1,
    scannedConections: [],
    selectedConnections: [connectionsFix[0], connectionsFix[1]],
    ourIdentifier: "mock-id",
    newIdentifier: {
      id: "",
      displayName: "",
      createdAtUTC: "",
      theme: 0,
      creationStatus: CreationStatus.COMPLETE,
      groupMetadata: undefined,
    },
    color: IdentifierColor.One,
  };

  const dispatchMock = jest.fn();
  const storeMocked = {
    ...makeTestStore(store.getState()),
    dispatch: dispatchMock,
  };

  const innerSetState = jest.fn();
  const setState = jest.fn((args: any) => {
    if (typeof args === "function") {
      const result = args({});

      innerSetState(result);
    }
  });
  const setBlur = jest.fn();
  const resetModal = jest.fn();

  test("Renders default content", async () => {
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <Summary
          state={stage4State}
          setState={setState}
          componentId={"create-identifier-modal"}
          setBlur={setBlur}
          resetModal={resetModal}
        />
      </Provider>
    );
    expect(
      getByText(EN_TRANSLATIONS.createidentifier.confirm.title)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.createidentifier.confirm.subtitle)
    ).toBeVisible();
    expect(getByText(stage4State.displayNameValue)).toBeVisible();
    expect(getByText(connectionsFix[0].label)).toBeVisible();

    expect(
      getByText(EN_TRANSLATIONS.createidentifier.confirm.treshold)
    ).toBeVisible();

    expect(
      getByTestId("confirm-threshold").innerHTML.includes(
        String(stage4State.threshold)
      )
    ).toBe(true);
  });

  test("Continue button click", async () => {
    const { getByText } = render(
      <Provider store={storeMocked}>
        <Summary
          state={stage4State}
          setState={setState}
          componentId={"create-identifier-modal"}
          setBlur={setBlur}
          resetModal={resetModal}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(
        getByText(EN_TRANSLATIONS.createidentifier.confirm.continue)
      );
    });

    await waitFor(() => {
      expect(createGroupMock).toBeCalledWith(
        "mock-id",
        [connectionsFix[0], connectionsFix[1]],
        stage4State.threshold
      );
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.IDENTIFIER_CREATED)
      );
    });
  });

  test("Continue button click: empty our identifier", async () => {
    const stage4State = {
      identifierCreationStage: 4,
      displayNameValue: "Duke",
      selectedAidType: 0,
      selectedTheme: 0,
      threshold: 1,
      scannedConections: [],
      selectedConnections: [connectionsFix[0], connectionsFix[1]],
      ourIdentifier: "",
      newIdentifier: {
        id: "",
        displayName: "",
        createdAtUTC: "",
        theme: 0,
        creationStatus: CreationStatus.COMPLETE,
        groupMetadata: undefined,
      },
      color: IdentifierColor.One,
    };

    const { getByText } = render(
      <Provider store={storeMocked}>
        <Summary
          state={stage4State}
          setState={setState}
          componentId={"create-identifier-modal"}
          setBlur={setBlur}
          resetModal={resetModal}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(
        getByText(EN_TRANSLATIONS.createidentifier.confirm.continue)
      );
    });

    await waitFor(() => {
      expect(createGroupMock).not.toBeCalled();
    });
  });

  test("Cancel button click", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <Summary
          state={stage4State}
          setState={setState}
          componentId={"create-identifier-modal"}
          setBlur={setBlur}
          resetModal={resetModal}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(
        getByText(EN_TRANSLATIONS.createidentifier.confirm.cancel)
      );
    });

    await waitFor(() => {
      expect(getByTestId("alert-cancel")).toBeVisible();
    });
  });

  test("Back to stage 2", async () => {
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <Summary
          state={stage4State}
          setState={setState}
          componentId={"create-identifier-modal"}
          setBlur={setBlur}
          resetModal={resetModal}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("confirm-back-connection-button-0"));
    });

    await waitFor(() => {
      expect(innerSetState).toBeCalledWith({
        identifierCreationStage: Stage.Members,
      });
    });
  });

  test("Back to stage 3", async () => {
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <Summary
          state={stage4State}
          setState={setState}
          componentId={"create-identifier-modal"}
          setBlur={setBlur}
          resetModal={resetModal}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("confirm-back-threshold-button"));
    });

    await waitFor(() => {
      expect(innerSetState).toBeCalledWith({
        identifierCreationStage: Stage.SetupThreshold,
      });
    });
  });

  test("Back button click", async () => {
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <Summary
          state={stage4State}
          setState={setState}
          componentId={"create-identifier-modal"}
          setBlur={setBlur}
          resetModal={resetModal}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("close-button"));
    });

    await waitFor(() => {
      expect(innerSetState).toBeCalledWith({
        identifierCreationStage: Stage.SetupThreshold,
      });
    });
  });
});
