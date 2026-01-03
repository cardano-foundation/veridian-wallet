import { IonInput, IonLabel } from "@ionic/react";
import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import {
  multisignIdentifierFix,
  pendingMemberIdentifierFix,
} from "../../__fixtures__/filteredIdentifierFix";
import { identifierFix } from "../../__fixtures__/identifierFix";
import { profileCacheFixData } from "../../__fixtures__/storeDataFix";
import { makeTestStore } from "../../utils/makeTestStore";
import { CustomInputProps } from "../CustomInput/CustomInput.types";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { SetGroupUserName } from "./SetGroupUserName";
import { addOrUpdateProfileIdentity } from "../../../store/reducers/profileCache";

const updateMock = jest.fn();

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      identifiers: {
        updateGroupUsername: () => updateMock(() => Promise.resolve(true)),
      },
    },
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children }: { children: any }) => children,
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
        />
      </>
    );
  },
}));

const testIdentifier = { ...multisignIdentifierFix[0] };
delete testIdentifier.groupUsername;

describe("Set individual name", () => {
  const dispatchMock = jest.fn();
  let mockedStore: Store<unknown, AnyAction>;

  beforeEach(() => {
    updateMock.mockImplementation(() => Promise.resolve(true));
  });

  beforeAll(() => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: true,
        },
      },
      profilesCache: profileCacheFixData,
    };
    mockedStore = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };
  });

  test("render", async () => {
    const { getByTestId, getByText } = render(
      <Provider store={mockedStore}>
        <SetGroupUserName identifier={identifierFix[0]} />
      </Provider>
    );

    expect(getByTestId("edit-member-name-input")).toBeVisible();
    expect(getByText(EN_TRANSLATIONS.setgroup.title)).toBeVisible();
    expect(getByText(EN_TRANSLATIONS.setgroup.alert)).toBeVisible();
    expect(getByText(EN_TRANSLATIONS.setgroup.text)).toBeVisible();
  });

  test("set name", async () => {
    const { getByTestId } = render(
      <Provider store={mockedStore}>
        <SetGroupUserName identifier={identifierFix[0]} />
      </Provider>
    );

    act(() => {
      fireEvent(
        getByTestId("edit-member-name-input"),
        new CustomEvent("ionInput", { detail: { value: "Duke" } })
      );
    });

    await waitFor(() => {
      expect(
        getByTestId("primary-button-set-group-name").getAttribute("disabled")
      ).toBe("false");
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-set-group-name"));
    });

    await waitFor(() => {
      expect(updateMock).toBeCalledTimes(1);
    });
  });

  test("set name when data loaded from redux", async () => {
    const { getByTestId } = render(
      <Provider store={mockedStore}>
        <SetGroupUserName
          identifier={deepFreeze(pendingMemberIdentifierFix[0])}
        />
      </Provider>
    );

    act(() => {
      fireEvent(
        getByTestId("edit-member-name-input"),
        new CustomEvent("ionInput", { detail: { value: "Duke" } })
      );
    });

    await waitFor(() => {
      expect(
        getByTestId("primary-button-set-group-name").getAttribute("disabled")
      ).toBe("false");
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-set-group-name"));
    });

    await waitFor(() => {
      expect(updateMock).toBeCalledTimes(1);
      expect(dispatchMock).toBeCalledWith(
        addOrUpdateProfileIdentity({
          ...pendingMemberIdentifierFix[0],
          groupMetadata: !pendingMemberIdentifierFix[0].groupMetadata
            ? undefined
            : {
                ...pendingMemberIdentifierFix[0].groupMetadata,
                proposedUsername: "Duke",
              },
        })
      );
    });
  });

  test("Display error when display name invalid", async () => {
    const { getByTestId, getByText } = render(
      <Provider store={mockedStore}>
        <SetGroupUserName identifier={identifierFix[0]} />
      </Provider>
    );

    act(() => {
      fireEvent(
        getByTestId("edit-member-name-input"),
        new CustomEvent("ionInput", { detail: { value: "" } })
      );
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.nameerror.onlyspace)).toBeVisible();
    });

    act(() => {
      fireEvent(
        getByTestId("edit-member-name-input"),
        new CustomEvent("ionInput", {
          detail: {
            value:
              "Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke",
          },
        })
      );
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.nameerror.maxlength)).toBeVisible();
    });

    act(() => {
      fireEvent(
        getByTestId("edit-member-name-input"),
        new CustomEvent("ionInput", { detail: { value: "Duke@@" } })
      );
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.nameerror.hasspecialchar)).toBeVisible();
    });
  });
});

function deepFreeze<T>(obj: T): T {
  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as any)[prop];

    if (
      value !== null &&
      (typeof value === "object" || typeof value === "function") &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value);
    }
  });

  return obj;
}
