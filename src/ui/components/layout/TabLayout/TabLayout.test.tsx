import { fireEvent, render, waitFor } from "@testing-library/react";
import { TabLayout } from "./TabLayout";

const TabTitle = "Tab title";
describe("Tab layout", () => {
  test("Render back button", async () => {
    const backButtonAction = jest.fn();
    const { getByTestId, getByText } = render(
      <TabLayout
        header
        backButton
        backButtonAction={backButtonAction}
        title={TabTitle}
      />
    );

    await waitFor(() => {
      expect(getByText(TabTitle)).toBeVisible();
      expect(getByTestId("tab-back-button")).toBeVisible();
    });

    fireEvent.click(getByTestId("tab-back-button"));
    expect(backButtonAction).toBeCalled();
  });

  test("Render done button", async () => {
    const doneAction = jest.fn();
    const { getByTestId, getByText } = render(
      <TabLayout
        header
        doneLabel="done"
        doneAction={doneAction}
        title={TabTitle}
      />
    );

    await waitFor(() => {
      expect(getByText(TabTitle)).toBeVisible();
      expect(getByTestId("tab-done-button")).toBeVisible();
    });

    fireEvent.click(getByTestId("tab-done-button"));
    expect(doneAction).toBeCalled();
  });

  test("Render action button", async () => {
    const actionButtonAction = jest.fn();
    const { getByTestId, getByText } = render(
      <TabLayout
        header
        actionButton
        actionButtonLabel="Action button"
        actionButtonAction={actionButtonAction}
        title={TabTitle}
      />
    );

    await waitFor(() => {
      expect(getByText(TabTitle)).toBeVisible();
      expect(getByTestId("action-button")).toBeVisible();
    });

    fireEvent.click(getByTestId("action-button"));
    expect(actionButtonAction).toBeCalled();
  });
});
