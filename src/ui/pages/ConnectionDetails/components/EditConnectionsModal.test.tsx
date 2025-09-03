import {
  ionFireEvent,
  mockIonicReact,
  waitForIonicReact,
} from "@ionic/react-test-utils";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../routes/paths";
import { setToastMsg } from "../../../../store/reducers/stateCache";
import { connectionsFix } from "../../../__fixtures__/connectionsFix";
import { ToastMsgType } from "../../../globals/types";
import { formatShortDate } from "../../../utils/formatters";
import {
  EditConnectionsContainer,
  EditConnectionsModal,
} from "./EditConnectionsModal";
import { makeTestStore } from "../../../utils/makeTestStore";
mockIonicReact();

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonInput: (props: any) => {
    const {
      onIonBlur,
      onIonFocus,
      onIonInput,
      value,
      placeholder,
      ...componentProps
    } = props;

    return (
      <input
        value={value}
        placeholder={placeholder}
        data-testid={componentProps["data-testid"]}
        onBlur={(e) => onIonBlur?.(e)}
        onFocus={(e) => onIonFocus?.(e)}
        onChange={(e) => onIonInput?.(e)}
      />
    );
  },
  IonTextarea: (props: any) => {
    const {
      onIonBlur,
      onIonFocus,
      onIonInput,
      value,
      placeholder,
      ...componentProps
    } = props;
    return (
      <textarea
        value={value}
        placeholder={placeholder}
        data-testid={componentProps["data-testid"]}
        onBlur={(e) => onIonBlur?.(e)}
        onFocus={(e) => onIonFocus?.(e)}
        onChange={(e) => onIonInput?.(e)}
      />
    );
  },
}));

const createNoteMock = jest.fn(() => Promise.resolve(true));
const deleteNoteMock = jest.fn(() => Promise.resolve(true));
const updateNoteMock = jest.fn(() => Promise.resolve(true));
jest.mock("../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      connections: {
        createConnectionNote: () => createNoteMock(),
        deleteConnectionNoteById: () => deleteNoteMock(),
        updateConnectionNoteById: () => updateNoteMock(),
      },
    },
  },
}));

const dispatchMock = jest.fn();
const initialStateFull = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
  },
  seedPhraseCache: {},
};

const mockNow = 1466424490000;
let dateSpy: any;

describe("Edit Connection Modal", () => {
  beforeAll(() => {
    dateSpy = jest.spyOn(Date, "now").mockReturnValue(mockNow);
  });

  afterAll(() => {
    dateSpy.mockRestore();
  });

  test("Render edit connection modal: empty note", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <EditConnectionsModal
          onConfirm={jest.fn()}
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
          setNotes={jest.fn()}
          notes={[]}
          connectionDetails={connectionsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByTestId("card-title-ebfeb1ebc6f1c276ef71212ec20").innerHTML
      ).toBe(connectionsFix[0].label);
    });
    expect(
      getByTestId("card-subtitle-ebfeb1ebc6f1c276ef71212ec20").innerHTML
    ).toBe(formatShortDate(connectionsFix[0].createdAtUTC));
    expect(getByTestId("action-button")).toBeVisible();
    expect(getByTestId("close-button")).toBeVisible();
    expect(getByTestId("add-note-button")).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.tabs.connections.details.nocurrentnotesext)
    ).toBeVisible();
  });

  test("Render edit connection modal", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <EditConnectionsContainer
          onConfirm={jest.fn()}
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
          setNotes={jest.fn()}
          notes={[
            {
              id: "1",
              title: "Mock Note",
              message: "Mock Note",
            },
          ]}
          connectionDetails={connectionsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByTestId("card-title-ebfeb1ebc6f1c276ef71212ec20").innerHTML
      ).toBe(connectionsFix[0].label);
    });

    await waitFor(() => {
      const titleInput = getByTestId("edit-connections-modal-note-title-1");
      const messageInput = getByTestId("edit-connections-modal-note-message-1");

      expect((titleInput as HTMLInputElement).value).toBe("Mock Note");
      expect((messageInput as HTMLTextAreaElement).value).toBe("Mock Note");
      expect((titleInput as HTMLInputElement).placeholder).toBe(
        EN_TRANSLATIONS.tabs.connections.details.notes.placeholders.title
      );
      expect((messageInput as HTMLTextAreaElement).placeholder).toBe(
        EN_TRANSLATIONS.tabs.connections.details.notes.placeholders.message
      );
    });
  });

  test("Delete note alert", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId, unmount, queryByText } = render(
      <Provider store={storeMocked}>
        <EditConnectionsContainer
          onConfirm={jest.fn()}
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
          setNotes={jest.fn()}
          notes={[
            {
              id: "1",
              title: "Mock Note",
              message: "Mock Note",
            },
          ]}
          connectionDetails={connectionsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByTestId("card-title-ebfeb1ebc6f1c276ef71212ec20").innerHTML
      ).toBe(connectionsFix[0].label);
    });

    await waitFor(() => {
      const titleInput = getByTestId("edit-connections-modal-note-title-1");
      expect((titleInput as HTMLInputElement).value).toBe("Mock Note");
      expect(getByTestId("note-delete-button-1")).toBeVisible();
    });

    act(() => {
      ionFireEvent.click(getByTestId("note-delete-button-1"));
    });

    await waitFor(() => {
      const alerts = Array.from(
        document.querySelectorAll('[data-testid="alert-confirm-delete-note"]')
      ) as HTMLElement[];
      const openAlert = alerts.find(
        (a) => a.getAttribute("is-open") === "true"
      );
      expect(openAlert).toBeDefined();
      expect(openAlert?.textContent).toContain(
        EN_TRANSLATIONS.tabs.connections.details.options.alert.deletenote.title
      );
    });

    fireEvent.click(getByTestId("alert-confirm-delete-note-confirm-button"));
    fireEvent.click(getByTestId("alert-confirm-delete-note-cancel-button"));

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.NOTE_REMOVED)
      );
      expect(
        queryByText(
          EN_TRANSLATIONS.tabs.connections.details.options.alert.deletenote
            .title
        )
      ).toBeNull();
    });

    unmount();
  });

  test("Add note", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId, getAllByTestId } = render(
      <Provider store={storeMocked}>
        <EditConnectionsContainer
          onConfirm={jest.fn()}
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
          setNotes={jest.fn()}
          notes={[]}
          connectionDetails={connectionsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByTestId("card-title-ebfeb1ebc6f1c276ef71212ec20").innerHTML
      ).toBe(connectionsFix[0].label);
    });

    act(() => {
      fireEvent.click(getByTestId("add-note-button"));
    });

    await waitFor(() => {
      expect(getAllByTestId("connection-note").length).toBeGreaterThan(0);
    });
  });

  test("Save process not working when user confirm empty data", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const confirmFn = jest.fn();

    const { getByTestId, getAllByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <EditConnectionsContainer
          onConfirm={confirmFn}
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
          setNotes={jest.fn()}
          notes={[]}
          connectionDetails={connectionsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByTestId("card-title-ebfeb1ebc6f1c276ef71212ec20").innerHTML
      ).toBe(connectionsFix[0].label);
      expect(getByTestId("action-button")).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("add-note-button"));
    });

    await waitForIonicReact();

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.connections.details.notes.notetitle)
      ).toBeVisible();
      expect(getAllByTestId("connection-note").length).toBe(1);
      expect(
        getByText(EN_TRANSLATIONS.tabs.connections.details.notes.notemessage)
      ).toBeVisible();

      // Check placeholders for the newly added note
      const titleInput = getByTestId(
        "edit-connections-modal-note-title-temp1466424490000"
      );
      const messageInput = getByTestId(
        "edit-connections-modal-note-message-temp1466424490000"
      );
      expect((titleInput as HTMLInputElement).placeholder).toBe(
        EN_TRANSLATIONS.tabs.connections.details.notes.placeholders.title
      );
      expect((messageInput as HTMLTextAreaElement).placeholder).toBe(
        EN_TRANSLATIONS.tabs.connections.details.notes.placeholders.message
      );
    });

    const actionBtn = getByTestId("action-button");

    act(() => {
      ionFireEvent.click(actionBtn);
    });

    expect(confirmFn).toBeCalledTimes(0);
  });

  test("Update note", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <EditConnectionsContainer
          onConfirm={jest.fn()}
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
          setNotes={jest.fn()}
          notes={[
            {
              id: "1",
              title: "Note 1",
              message: "Note message 1",
            },
          ]}
          connectionDetails={connectionsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByTestId("card-title-ebfeb1ebc6f1c276ef71212ec20").innerHTML
      ).toBe(connectionsFix[0].label);
    });
    const noteInput = getByTestId("edit-connections-modal-note-title-1");
    const noteMessageInput = getByTestId(
      "edit-connections-modal-note-message-1"
    );

    act(() => {
      fireEvent.change(noteInput, {
        target: { value: "new Value" },
      });

      fireEvent.change(noteMessageInput, {
        target: { value: "new Value" },
      });

      fireEvent.blur(noteInput);
    });

    await waitFor(() => {
      expect((noteInput as HTMLInputElement).value).toEqual("new Value");
    });
  });

  test("Update unchange note", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <EditConnectionsContainer
          onConfirm={jest.fn()}
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
          setNotes={jest.fn()}
          notes={[
            {
              id: "1",
              title: "Note 1",
              message: "Note message 1",
            },
          ]}
          connectionDetails={connectionsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByTestId("card-title-ebfeb1ebc6f1c276ef71212ec20").innerHTML
      ).toBe(connectionsFix[0].label);
    });

    const noteInput = getByTestId("edit-connections-modal-note-title-1");

    act(() => {
      fireEvent.blur(noteInput);
    });

    await waitFor(() => {
      expect((noteInput as HTMLInputElement).value).toEqual("Note 1");
    });
  });

  test("Save note", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const confirmFn = jest.fn();

    const { getByTestId, unmount } = render(
      <Provider store={storeMocked}>
        <EditConnectionsContainer
          onConfirm={confirmFn}
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
          setNotes={jest.fn()}
          notes={[
            {
              id: "temp-1",
              title: "Note temp",
              message: "Note message temp",
            },
            {
              id: "1",
              title: "Note 1",
              message: "Note message 1",
            },
            {
              id: "2",
              title: "Note 1",
              message: "Note message 1",
            },
          ]}
          connectionDetails={connectionsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByTestId("card-title-ebfeb1ebc6f1c276ef71212ec20").innerHTML
      ).toBe(connectionsFix[0].label);
    });
    const noteInput = getByTestId("edit-connections-modal-note-title-1");
    const noteMessageInput = getByTestId(
      "edit-connections-modal-note-message-1"
    );

    act(() => {
      fireEvent.change(noteInput, {
        target: { value: "new Value" },
      });

      fireEvent.change(noteMessageInput, {
        target: { value: "new Value" },
      });

      fireEvent.blur(noteInput);
    });

    await waitFor(() => {
      expect((noteInput as HTMLInputElement).value).toEqual("new Value");
    });

    act(() => {
      ionFireEvent.click(getByTestId("note-delete-button-2"));
    });

    await waitFor(() => {
      const alerts = Array.from(
        document.querySelectorAll('[data-testid="alert-confirm-delete-note"]')
      ) as HTMLElement[];
      const openAlert = alerts.find(
        (a) => a.getAttribute("is-open") === "true"
      );
      expect(openAlert).toBeDefined();
      expect(openAlert?.textContent).toContain(
        EN_TRANSLATIONS.tabs.connections.details.options.alert.deletenote.title
      );
    });

    act(() => {
      ionFireEvent.click(
        getByTestId("alert-confirm-delete-note-confirm-button")
      );
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.NOTE_REMOVED)
      );
    });

    ionFireEvent.click(getByTestId("alert-confirm-delete-note-cancel-button"));

    const actionBtn = getByTestId("action-button");

    act(() => {
      ionFireEvent.click(actionBtn);
    });

    await waitFor(() => {
      expect(createNoteMock).toBeCalledTimes(1);
      expect(deleteNoteMock).toBeCalledTimes(1);
      expect(updateNoteMock).toBeCalledTimes(1);
      expect(confirmFn).toBeCalledTimes(1);
    });

    unmount();
  });

  test("handle error when save note", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const confirmFn = jest.fn();

    createNoteMock.mockImplementation(() =>
      Promise.reject(new Error("Something wrong"))
    );

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <EditConnectionsContainer
          onConfirm={confirmFn}
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
          setNotes={jest.fn()}
          notes={[
            {
              id: "temp-1",
              title: "Note temp",
              message: "Note message temp",
            },
          ]}
          connectionDetails={connectionsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByTestId("card-title-ebfeb1ebc6f1c276ef71212ec20").innerHTML
      ).toBe(connectionsFix[0].label);
    });

    const actionBtn = getByTestId("action-button");

    act(() => {
      ionFireEvent.click(actionBtn);
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.FAILED_UPDATE_CONNECTION)
      );
    });
  });

  test("Done button closes modal without saving changes", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const setModalIsOpenMock = jest.fn();

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <EditConnectionsContainer
          onConfirm={jest.fn()}
          modalIsOpen={true}
          setModalIsOpen={setModalIsOpenMock}
          setNotes={jest.fn()}
          notes={[
            {
              id: "1",
              title: "Note 1",
              message: "Note message 1",
            },
          ]}
          connectionDetails={connectionsFix[0]}
        />
      </Provider>
    );

    const closeBtn = getByTestId("close-button");

    act(() => {
      ionFireEvent.click(closeBtn);
    });

    await waitFor(() => {
      expect(setModalIsOpenMock).toBeCalledWith(false);
      expect(createNoteMock).not.toBeCalled();
      expect(updateNoteMock).not.toBeCalled();
      expect(deleteNoteMock).not.toBeCalled();
    });
  });

  test("Confirm button disabled when validation errors exist", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <EditConnectionsContainer
          onConfirm={jest.fn()}
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
          setNotes={jest.fn()}
          notes={[
            {
              id: "1",
              title: "A".repeat(65),
              message: "Valid message",
            },
          ]}
          connectionDetails={connectionsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      const actionBtn = getByTestId("action-button");
      expect(actionBtn).toBeDisabled();
    });
  });

  test("Connection icon is displayed", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <EditConnectionsModal
          onConfirm={jest.fn()}
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
          setNotes={jest.fn()}
          notes={[]}
          connectionDetails={connectionsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("card-fallback-logo")).toBeVisible();
    });
  });

  test("Error messages displayed for invalid input", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <EditConnectionsContainer
          onConfirm={jest.fn()}
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
          setNotes={jest.fn()}
          notes={[
            {
              id: "1",
              title:
                "This is a very long title that exceeds the maximum length of 64 characters and should show an error message", // Title too long should show error
              message: "Valid message",
            },
          ]}
          connectionDetails={connectionsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.connections.details.notes.errors.title)
      ).toBeVisible();
    });
  });

  test("Confirm button enabled when no changes made", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const confirmFn = jest.fn();

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <EditConnectionsContainer
          onConfirm={confirmFn}
          modalIsOpen={true}
          setModalIsOpen={jest.fn()}
          setNotes={jest.fn()}
          notes={[
            {
              id: "1",
              title: "Note 1",
              message: "Note message 1",
            },
          ]}
          connectionDetails={connectionsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      const confirmBtn = getByTestId("action-button");
      expect(confirmBtn).not.toBeDisabled();
    });

    act(() => {
      const confirmBtn = getByTestId("action-button");
      ionFireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(confirmFn).toBeCalledTimes(1);
    });
  });
});
