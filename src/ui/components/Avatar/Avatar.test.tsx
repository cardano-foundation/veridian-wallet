import { render, fireEvent } from "@testing-library/react";
import { useAppSelector } from "../../../store/hooks";
import { Avatar } from "./Avatar";
import {
  defaultProfileDataFix,
  profileCacheFixData,
  profilesCachesFix,
} from "../../__fixtures__/storeDataFix";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";

jest.mock("@ionic/react", () => ({
  IonButton: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("../../../store/hooks", () => ({
  useAppSelector: jest.fn(),
}));

describe("Avatar", () => {
  beforeEach(() => {
    (useAppSelector as jest.Mock).mockImplementation((selector) =>
      selector.name === "getProfiles" ? profilesCachesFix : {}
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the first letter of the displayName in uppercase", () => {
    const { getByText } = render(
      <Avatar
        id={filteredIdentifierFix[0].id}
        handleAvatarClick={jest.fn()}
      />
    );
    expect(getByText("P")).toBeInTheDocument();
  });

  it("applies the correct rank class", () => {
    const { getByTestId } = render(
      <Avatar
        id={filteredIdentifierFix[1].id}
        handleAvatarClick={jest.fn()}
      />
    );

    expect(getByTestId("avatar-button").className).toContain("rank-1");
  });

  it("calls handleAvatarClick when clicked", () => {
    const handleClick = jest.fn();
    const { getByTestId } = render(
      <Avatar
        id={filteredIdentifierFix[2].id}
        handleAvatarClick={handleClick}
      />
    );
    fireEvent.click(getByTestId("avatar-button"));
    expect(handleClick).toHaveBeenCalled();
  });

  it("renders empty span if displayName is missing", () => {
    const { getByTestId } = render(
      <Avatar
        id="id-4"
        handleAvatarClick={jest.fn()}
      />
    );
    expect(getByTestId("avatar-button").textContent).toBe("");
  });
});
