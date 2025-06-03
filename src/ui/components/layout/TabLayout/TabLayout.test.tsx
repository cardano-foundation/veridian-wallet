import { fireEvent, render, waitFor } from "@testing-library/react";
import { mockIonicReact } from "@ionic/react-test-utils";
import { TabLayout } from "./TabLayout";

mockIonicReact();

describe("Tab layout", () => {
  test("Render back button", async () => {
    const backButtonAction = jest.fn();
    const { getByTestId } = render(
      <TabLayout
        header
        backButton
        backButtonAction={backButtonAction}
      />
    );

    await waitFor(() => {
      expect(getByTestId("tab-back-button")).toBeVisible();
    });

    fireEvent.click(getByTestId("tab-back-button"));
    expect(backButtonAction).toBeCalled();
  });

  test("Render done button", async () => {
    const doneAction = jest.fn();
    const { getByTestId } = render(
      <TabLayout
        header
        doneLabel="done"
        doneAction={doneAction}
      />
    );

    await waitFor(() => {
      expect(getByTestId("tab-done-button")).toBeVisible();
    });

    fireEvent.click(getByTestId("tab-done-button"));
    expect(doneAction).toBeCalled();
  });

  test("Render action button", async () => {
    const actionButtonAction = jest.fn();
    const { getByTestId } = render(
      <TabLayout
        header
        actionButton
        actionButtonLabel="Action button"
        actionButtonAction={actionButtonAction}
      />
    );

    await waitFor(() => {
      expect(getByTestId("action-button")).toBeVisible();
    });

    fireEvent.click(getByTestId("action-button"));
    expect(actionButtonAction).toBeCalled();
  });
});
