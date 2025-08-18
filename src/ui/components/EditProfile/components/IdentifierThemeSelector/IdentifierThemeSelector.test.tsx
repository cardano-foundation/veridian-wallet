import { fireEvent, render, waitFor } from "@testing-library/react";
import { IdentifierColor } from "../IdentifierColorSelector";
import { IdentifierThemeSelector } from "./IdentifierThemeSelector";

describe("Identifier Theme Selector", () => {
  test("It switches KERI card from theme 0 to theme 1", async () => {
    const setNewSelectedTheme = jest.fn();
    const { getByTestId } = render(
      <IdentifierThemeSelector
        color={IdentifierColor.One}
        selectedTheme={0}
        setSelectedTheme={setNewSelectedTheme}
      />
    );

    await waitFor(() =>
      expect(getByTestId("identifier-theme-selector")).toBeInTheDocument()
    );

    fireEvent.click(getByTestId("identifier-theme-selector-item-0"));

    await waitFor(() => {
      expect(setNewSelectedTheme).toHaveBeenCalledWith(0);
    });
  });
});
