import { render, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
jest.mock("@ionic/react", () => ({
  IonIcon: (props: any) =>
    React.createElement("svg", { "data-testid": "ion-icon", ...props }),
}));
import { Tile } from "./Tile";

afterEach(() => {
  cleanup();
});

describe("Tile component", () => {
  test("renders title and text and responds to click", () => {
    const handleClick = jest.fn();
    const props = {
      icon: "test-icon",
      title: "My Tile",
      text: "Tile description",
      className: "custom-class",
      handleTileClick: handleClick,
    };

    const { getByTestId, getByText } = render(<Tile {...props} />);

    const tile = getByTestId(`tile-${props.title}`);
    expect(tile).toBeInTheDocument();

    expect(getByText("My Tile")).toBeVisible();
    expect(getByText("Tile description")).toBeVisible();

    fireEvent.click(tile);
    expect(handleClick).toHaveBeenCalled();
  });

  test("renders badge and chevron when provided", () => {
    const props = {
      icon: "test-icon",
      title: "Tile 2",
      text: "More info",
      badge: "3",
      chevron: true,
    } as const;

    const { getByText, container } = render(<Tile {...props} />);

    expect(getByText("3")).toBeVisible();

    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });
});

export {};
