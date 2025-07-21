import { setupIonicReact } from "@ionic/react";
import { mockIonicReact } from "@ionic/react-test-utils";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../../locales/en/en.json";
import { store } from "../../../../store";
import { connectionsFix } from "../../../__fixtures__/connectionsFix";
import { SetupThreshold } from "./SetupThreshold";
import { IdentifierColor } from "../../EditProfile/components/IdentifierColorSelector";
import { Stage } from "../CreateGroupIdentifier.types";
import { CreationStatus } from "../../../../core/agent/agent.types";
import { makeTestStore } from "../../../utils/makeTestStore";

setupIonicReact();
mockIonicReact();

describe("Create group identifier - Setup Threshold", () => {
  const stage3State = {
    identifierCreationStage: Stage.SetupThreshold,
    displayNameValue: "",
    selectedAidType: 0,
    selectedTheme: 0,
    threshold: 1,
    scannedConections: [],
    selectedConnections: [connectionsFix[0]],
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
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <SetupThreshold
          state={stage3State}
          setState={setState}
          componentId={"create-identifier-modal"}
          setBlur={setBlur}
          resetModal={resetModal}
        />
      </Provider>
    );
    expect(
      getByText(EN_TRANSLATIONS.createidentifier.threshold.title)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.createidentifier.threshold.subtitle)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.createidentifier.threshold.label)
    ).toBeVisible();
    expect(getByTestId("decrease-threshold-button")).toBeVisible();
    expect(getByTestId("increase-threshold-button")).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.createidentifier.threshold.continue)
    ).toBeVisible();
  });

  test("Continue button click", async () => {
    const { getByText } = render(
      <Provider store={storeMocked}>
        <SetupThreshold
          state={stage3State}
          setState={setState}
          componentId={"create-identifier-modal"}
          setBlur={setBlur}
          resetModal={resetModal}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(
        getByText(EN_TRANSLATIONS.createidentifier.threshold.continue)
      );
    });

    await waitFor(() => {
      expect(innerSetState).toBeCalledWith({
        identifierCreationStage: Stage.Summary,
      });
    });
  });

  test("Increase/decrease threshold", async () => {
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <SetupThreshold
          state={stage3State}
          setState={setState}
          componentId={"create-identifier-modal"}
          setBlur={setBlur}
          resetModal={resetModal}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("increase-threshold-button"));
    });

    await waitFor(() => {
      expect(innerSetState).toBeCalledWith({
        threshold: 2,
      });
    });

    act(() => {
      fireEvent.click(getByTestId("decrease-threshold-button"));
    });

    expect(innerSetState).not.toHaveBeenNthCalledWith(2);
  });

  test("Back button click", async () => {
    const { getByText } = render(
      <Provider store={storeMocked}>
        <SetupThreshold
          state={stage3State}
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
        identifierCreationStage: Stage.Members,
        threshold: 1,
      });
    });
  });
});
