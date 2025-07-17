import { fireEvent, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { IonReactMemoryRouter } from "@ionic/react-router";
import { createMemoryHistory } from "history";
import { arrowBackOutline } from "ionicons/icons";
import { RoutePath } from "../../../routes";
import { makeTestStore } from "../../utils/makeTestStore";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { PageHeader } from "./PageHeader";

describe("Page Header", () => {
  const dispatchMock = jest.fn();
  const initialState = {
    stateCache: {
      routes: ["/"],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
      },
    },
    seedPhraseCache: {
      seedPhrase: "",
      bran: "",
    },
  };

  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  test("Renders Page Header elements part 1", () => {
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <PageHeader
          backButton={true}
          currentPath={RoutePath.GENERATE_SEED_PHRASE}
          progressBar={true}
          progressBarValue={0.66}
          progressBarBuffer={1}
        />
      </Provider>
    );

    expect(getByTestId("back-button")).toBeVisible();
    expect(getByTestId("progress-bar")).toBeVisible();
    expect(getByTestId("progress-bar")).toHaveAttribute("value", "0.66");
    expect(getByTestId("progress-bar")).toHaveAttribute("buffer", "1");
  });

  test("Renders Page Header elements part 2", () => {
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <PageHeader
          closeButton={true}
          title="Title"
          actionButton={true}
          actionButtonLabel="Action"
        />
      </Provider>
    );

    expect(getByTestId("close-button")).toBeVisible();
    expect(getByText("Title")).toBeVisible();
    expect(getByTestId("action-button")).toBeVisible();
    expect(getByTestId("action-button")).toHaveTextContent("Action");
  });

  test("clicking on action button invokes handleOnAction function", async () => {
    const mockActionButton = jest.fn();

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <PageHeader
          closeButton={true}
          title="Title"
          actionButton={true}
          actionButtonLabel="Action"
          actionButtonAction={mockActionButton}
        />
      </Provider>
    );
    expect(getByTestId("action-button")).toBeVisible();
    expect(mockActionButton).not.toHaveBeenCalled();
    fireEvent.click(getByTestId("action-button"));
    expect(storeMocked.dispatch).not.toHaveBeenCalled();
  });

  test("Render action button icon", async () => {
    const mockActionButton = jest.fn();

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <PageHeader
          closeButton={true}
          title="Title"
          actionButton={true}
          actionButtonAction={mockActionButton}
          actionButtonIcon={arrowBackOutline}
        />
      </Provider>
    );
    expect(getByTestId("action-button")).toBeVisible();
    expect(getByTestId("action-button-icon")).toBeVisible();
    expect(mockActionButton).not.toHaveBeenCalled();
    fireEvent.click(getByTestId("action-button"));
    expect(storeMocked.dispatch).not.toHaveBeenCalled();
  });

  test("clicking on close button invokes handleOnClose function", async () => {
    const mockCloseButton = jest.fn();

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <PageHeader
          closeButton={true}
          closeButtonLabel="Close"
          title="Title"
        />
      </Provider>
    );
    expect(getByTestId("close-button")).toBeVisible();
    expect(mockCloseButton).not.toHaveBeenCalled();
    fireEvent.click(getByTestId("close-button"));
    expect(storeMocked.dispatch).not.toHaveBeenCalled();
  });

  test("Render close icon", async () => {
    const mockCloseButton = jest.fn();

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <PageHeader
          closeButton={true}
          title="Title"
          closeButtonAction={mockCloseButton}
        />
      </Provider>
    );
    expect(getByTestId("close-button")).toBeVisible();
    expect(getByTestId("close-button-icon")).toBeVisible();
    expect(mockCloseButton).not.toHaveBeenCalled();
    fireEvent.click(getByTestId("close-button"));
    expect(storeMocked.dispatch).not.toHaveBeenCalled();
  });

  test("clicking on back button invokes handleOnBack function", async () => {
    const mockOnBack = jest.fn();

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <PageHeader
          backButton={true}
          currentPath={"/"}
          title={"Title"}
          onBack={mockOnBack}
        >
          <p>Content</p>
        </PageHeader>
      </Provider>
    );

    expect(getByTestId("back-button")).toBeVisible();

    fireEvent.click(getByTestId("back-button"));

    expect(mockOnBack).toBeCalled();
  });

  test("clicking on back button invokes beforeBack function", async () => {
    const mockBeforeBack = jest.fn();
    const history = createMemoryHistory();
    history.push(TabsRoutePath.IDENTIFIERS);

    const { getByTestId } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={storeMocked}>
          <PageHeader
            backButton={true}
            currentPath={"/"}
            title={"Title"}
            beforeBack={mockBeforeBack}
          >
            <p>Content</p>
          </PageHeader>
        </Provider>
      </IonReactMemoryRouter>
    );

    expect(getByTestId("back-button")).toBeVisible();

    fireEvent.click(getByTestId("back-button"));

    expect(mockBeforeBack).toBeCalled();
  });
});
