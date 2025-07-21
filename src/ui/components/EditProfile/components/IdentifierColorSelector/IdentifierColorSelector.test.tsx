import { fireEvent, render } from "@testing-library/react";
import { act } from "react";
import { IdentifierColorSelector } from "./IdentifierColorSelector";
import { IdentifierColor } from "./IdentifierColorSelector.types";

const ColorConfigs = [
  IdentifierColor.One,
  IdentifierColor.Two,
  IdentifierColor.Three,
  IdentifierColor.Four,
  IdentifierColor.Five,
];

describe("Identifier color selector", () => {
  test("Render", async () => {
    const colorChangeEvent = jest.fn();

    const { getByTestId } = render(
      <IdentifierColorSelector
        onColorChange={colorChangeEvent}
        value={IdentifierColor.One}
      />
    );

    for (const item of ColorConfigs) {
      const color = getByTestId(`color-${item}`);
      expect(color).toBeVisible();

      act(() => {
        fireEvent.click(color);
      });

      expect(colorChangeEvent).toBeCalledWith(item);
    }
  });
});
