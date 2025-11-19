import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import { IonReactMemoryRouter } from "@ionic/react-router";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { makeTestStore } from "../../../../utils/makeTestStore";
import { ScanToLogin } from "./ScanToLogin";

afterEach(() => {
  cleanup();
});

describe("ScanToLogin component", () => {
  test("renders modal and content when open", async () => {
    const setIsOpen = jest.fn();
    const store = makeTestStore();

    const history = createMemoryHistory();
    history.push("/tabs/home");

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <IonReactMemoryRouter
          history={history}
          initialEntries={["/tabs/home"]}
        >
          <ScanToLogin
            isOpen={true}
            setIsOpen={setIsOpen}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("scan-to-login")).toBeVisible();
    });

    expect(
      getByText(EN_TRANSLATIONS.tabs.home.tab.modals.scan.content.title)
    ).toBeInTheDocument();

    const description = EN_TRANSLATIONS.tabs.home.tab.modals.scan.content
      .description as string;
    const firstParagraph = description.split(/\r?\n\r?\n+/)[0].trim();

    await waitFor(() => {
      expect(getByText(firstParagraph)).toBeVisible();
    });
  });

  test("close button is rendered and clickable", async () => {
    const setIsOpen = jest.fn();
    const store = makeTestStore();

    const history = createMemoryHistory();
    history.push("/tabs/home");

    const { getByTestId } = render(
      <Provider store={store}>
        <IonReactMemoryRouter
          history={history}
          initialEntries={["/tabs/home"]}
        >
          <ScanToLogin
            isOpen={true}
            setIsOpen={setIsOpen}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("close-button")).toBeVisible();
    });

    userEvent.click(getByTestId("close-button"));
    expect(getByTestId("close-button")).toBeVisible();
  });

  test("onDidDismiss invokes setIsOpen(false)", async () => {
    const setIsOpen = jest.fn();
    const store = makeTestStore();

    const history = createMemoryHistory();
    history.push("/tabs/home");

    const { getByTestId } = render(
      <Provider store={store}>
        <IonReactMemoryRouter
          history={history}
          initialEntries={["/tabs/home"]}
        >
          <ScanToLogin
            isOpen={true}
            setIsOpen={setIsOpen}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("scan-to-login")).toBeVisible();
    });

    act(() => {
      getByTestId("scan-to-login").dispatchEvent(
        new CustomEvent("didDismiss", { detail: {} })
      );
    });

    await waitFor(() => {
      expect(setIsOpen).toHaveBeenCalledWith(false);
    });
  });
});
