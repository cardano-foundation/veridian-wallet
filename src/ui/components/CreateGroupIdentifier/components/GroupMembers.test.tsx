import { setupIonicReact } from "@ionic/react";
import { ionFireEvent, mockIonicReact } from "@ionic/react-test-utils";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../../locales/en/en.json";
import { store } from "../../../../store";
import { connectionsFix } from "../../../__fixtures__/connectionsFix";
import { GroupMembers } from "./GroupMembers";
import { IdentifierColor } from "../../EditProfile/components/IdentifierColorSelector";
import { Stage } from "../CreateGroupIdentifier.types";
import { CreationStatus } from "../../../../core/agent/agent.types";
import { makeTestStore } from "../../../utils/makeTestStore";

setupIonicReact();
mockIonicReact();

describe("Identifier Stage 2", () => {
  const stage2State = {
    identifierCreationStage: 0,
    displayNameValue: "",
    selectedAidType: 0,
    selectedTheme: 0,
    threshold: 1,
    scannedConections: [connectionsFix[0]],
    selectedConnections: [],
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
    const { getByText } = render(
      <Provider store={storeMocked}>
        <GroupMembers
          state={stage2State}
          setState={setState}
          componentId={"create-identifier-modal"}
          setBlur={setBlur}
          resetModal={resetModal}
        />
      </Provider>
    );
    expect(
      getByText(EN_TRANSLATIONS.createidentifier.connections.title)
    ).toBeVisible();
    expect(getByText(connectionsFix[0].label)).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.createidentifier.connections.continue)
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.createidentifier.connections.continue
      ).getAttribute("disabled")
    ).toBe("false");
  });

  test("Continue button disable status when select or unselect all connection", async () => {
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <GroupMembers
          state={stage2State}
          setState={setState}
          componentId={"create-identifier-modal"}
          setBlur={setBlur}
          resetModal={resetModal}
        />
      </Provider>
    );

    act(() => {
      ionFireEvent.ionChange(getByTestId("connection-checkbox-0"), "false");
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.createidentifier.connections.continue
        ).getAttribute("disabled")
      ).toBe("true");
    });

    act(() => {
      ionFireEvent.ionChange(getByTestId("connection-checkbox-0"), "false");
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.createidentifier.connections.continue
        ).getAttribute("disabled")
      ).toBe("false");
    });
  });

  test("Continue button click", async () => {
    const { getByText } = render(
      <Provider store={storeMocked}>
        <GroupMembers
          state={stage2State}
          setState={setState}
          componentId={"create-identifier-modal"}
          setBlur={setBlur}
          resetModal={resetModal}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(
        getByText(EN_TRANSLATIONS.createidentifier.connections.continue)
      );
    });

    await waitFor(() => {
      expect(innerSetState).toBeCalledWith({
        identifierCreationStage: Stage.SetupThreshold,
        selectedConnections: [connectionsFix[0]],
      });
    });
  });

  test("Back button click", async () => {
    const { getByText } = render(
      <Provider store={storeMocked}>
        <GroupMembers
          state={stage2State}
          setState={setState}
          componentId={"create-identifier-modal"}
          setBlur={setBlur}
          resetModal={resetModal}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATIONS.createidentifier.back));
    });

    await waitFor(() => {
      expect(innerSetState).toBeCalledWith({
        identifierCreationStage: Stage.SetupConnection,
        selectedConnections: [],
      });
    });
  });
});
