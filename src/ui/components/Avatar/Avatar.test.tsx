import { render, fireEvent } from "@testing-library/react";
import { useAppSelector } from "../../../store/hooks";
import { Avatar } from "./Avatar";

jest.mock("@ionic/react", () => ({
  IonButton: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("../../../store/hooks", () => ({
  useAppSelector: jest.fn(),
}));

const mockIdentifiers = {
  "id-1": { displayName: "Alice", createdAtUTC: "2023-01-01T00:00:00Z" },
  "id-2": { displayName: "Bob", createdAtUTC: "2023-01-02T00:00:00Z" },
  "id-3": { displayName: "Charlie", createdAtUTC: "2023-01-03T00:00:00Z" },
};

describe("Avatar", () => {
  beforeEach(() => {
    (useAppSelector as jest.Mock).mockImplementation((selector) =>
      selector.name === "getIdentifiersCache" ? mockIdentifiers : {}
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the first letter of the displayName in uppercase", () => {
    const { getByText } = render(
      <Avatar
        id="id-1"
        handleAvatarClick={jest.fn()}
      />
    );
    expect(getByText("A")).toBeInTheDocument();
  });

  it("applies the correct rank class", () => {
    const { getByTestId } = render(
      <Avatar
        id="id-2"
        handleAvatarClick={jest.fn()}
      />
    );

    expect(getByTestId("avatar-button").className).toContain("rank-1");
  });

  it("calls handleAvatarClick when clicked", () => {
    const handleClick = jest.fn();
    const { getByTestId } = render(
      <Avatar
        id="id-3"
        handleAvatarClick={handleClick}
      />
    );
    fireEvent.click(getByTestId("avatar-button"));
    expect(handleClick).toHaveBeenCalled();
  });

  it("renders empty span if displayName is missing", () => {
    const identifiers = {
      ...mockIdentifiers,
      "id-4": { createdAtUTC: "2023-01-04T00:00:00Z" },
    };
    (useAppSelector as jest.Mock).mockReturnValue(identifiers);
    const { getByTestId } = render(
      <Avatar
        id="id-4"
        handleAvatarClick={jest.fn()}
      />
    );
    expect(getByTestId("avatar-button").textContent).toBe("");
  });
});
