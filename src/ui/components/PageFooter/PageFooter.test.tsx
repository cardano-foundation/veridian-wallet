import { fireEvent, render } from "@testing-library/react";
import { chevronForwardOutline } from "ionicons/icons";
import { PageFooter } from "./PageFooter";

describe("Page Footer", () => {
  const pageId = "test-page";
  const primaryButtonText = "primaryButtonText";
  const primaryButtonAction = jest.fn();
  const secondaryButtonText = "secondaryButtonText";
  const secondaryButtonAction = jest.fn();
  const tertiaryButtonText = "tertiaryButtonText";
  const tertiaryButtonAction = jest.fn();
  const archiveButtonText = "archiveButtonText";
  const archiveButtonAction = jest.fn();
  const declineButtonText = "declineButtonText";
  const declineButtonAction = jest.fn();
  const deleteButtonText = "deleteButtonText";
  const deleteButtonAction = jest.fn();

  test("Renders all enabled buttons + page id", () => {
    const { getByText, getByTestId } = render(
      <PageFooter
        pageId={pageId}
        customClass="footer"
        primaryButtonText={primaryButtonText}
        primaryButtonAction={primaryButtonAction}
        secondaryButtonText={secondaryButtonText}
        secondaryButtonAction={secondaryButtonAction}
        tertiaryButtonText={tertiaryButtonText}
        tertiaryButtonAction={tertiaryButtonAction}
        archiveButtonText={archiveButtonText}
        archiveButtonAction={archiveButtonAction}
        declineButtonText={declineButtonText}
        declineButtonAction={declineButtonAction}
        declineButtonIcon={chevronForwardOutline}
        deleteButtonText={deleteButtonText}
        deleteButtonAction={deleteButtonAction}
      />
    );

    expect(getByText(primaryButtonText)).toBeInTheDocument();
    expect(getByText(secondaryButtonText)).toBeInTheDocument();
    expect(getByText(tertiaryButtonText)).toBeInTheDocument();

    fireEvent.click(getByTestId(`primary-button${`-${pageId}`}`));
    expect(primaryButtonAction.mock.calls.length).toEqual(1);

    fireEvent.click(getByTestId(`secondary-button${`-${pageId}`}`));
    expect(secondaryButtonAction.mock.calls.length).toEqual(1);

    fireEvent.click(getByTestId(`tertiary-button${`-${pageId}`}`));
    expect(tertiaryButtonAction.mock.calls.length).toEqual(1);

    fireEvent.click(getByTestId(`archive-button${`-${pageId}`}`));
    expect(archiveButtonAction.mock.calls.length).toEqual(1);

    fireEvent.click(getByTestId(`decline-button${`-${pageId}`}`));
    expect(declineButtonAction.mock.calls.length).toEqual(1);

    fireEvent.click(getByTestId(`delete-button${`-${pageId}`}`));
    expect(deleteButtonAction.mock.calls.length).toEqual(1);
  });

  test("Renders all disabled buttons + no page id", () => {
    const { getByText, getByTestId } = render(
      <PageFooter
        primaryButtonText={primaryButtonText}
        primaryButtonAction={primaryButtonAction}
        primaryButtonDisabled={true}
        primaryButtonIcon={chevronForwardOutline}
        secondaryButtonText={secondaryButtonText}
        secondaryButtonAction={secondaryButtonAction}
        secondaryButtonIcon={chevronForwardOutline}
        secondaryButtonDisabled={true}
        tertiaryButtonText={tertiaryButtonText}
        tertiaryButtonAction={tertiaryButtonAction}
        tertiaryButtonDisabled={true}
        tertiaryButtonIcon={chevronForwardOutline}
        archiveButtonText={archiveButtonText}
        archiveButtonAction={archiveButtonAction}
        archiveButtonDisabled
        declineButtonText={declineButtonText}
        declineButtonAction={declineButtonAction}
        declineButtonDisabled
        declineButtonIcon={chevronForwardOutline}
        deleteButtonText={deleteButtonText}
        deleteButtonAction={deleteButtonAction}
        deleteButtonDisabled
      />
    );

    expect(getByText(primaryButtonText)).toBeInTheDocument();
    expect(getByText(secondaryButtonText)).toBeInTheDocument();
    expect(getByText(tertiaryButtonText)).toBeInTheDocument();
    expect(getByText(archiveButtonText)).toBeInTheDocument();
    expect(getByText(declineButtonText)).toBeInTheDocument();

    expect(getByTestId("primary-button")).toHaveAttribute("disabled", "true");
    expect(getByTestId("secondary-button")).toHaveAttribute("disabled", "true");
    expect(getByTestId("tertiary-button")).toHaveAttribute("disabled", "true");
    expect(getByTestId("primary-button")).toHaveAttribute("disabled", "true");
    expect(getByTestId("archive-button")).toHaveAttribute("disabled", "true");
    expect(getByTestId("decline-button")).toHaveAttribute("disabled", "true");
  });

  test("Render button with link", () => {
    const link = "samplelink";

    const { getByText } = render(
      <PageFooter
        primaryButtonText={primaryButtonText}
        primaryButtonAction={link}
      />
    );

    expect(getByText(primaryButtonText).getAttribute("href")).toBe(link);
  });
});
