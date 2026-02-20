import { render } from "@testing-library/react";
import { ConnectionsBody } from "./ConnectionsBody";
import { ConnectionsBodyProps } from "./ConnectionsBody.types";

jest.mock("@ionic/react", () => ({
  IonGrid: ({ children }: any) => <div>{children}</div>,
  IonRow: ({ children }: any) => <div>{children}</div>,
  IonCol: ({ children }: any) => <div>{children}</div>,
  IonItemDivider: ({ children }: any) => <div>{children}</div>,
  IonItemGroup: ({ children }: any) => <div>{children}</div>,
  IonLabel: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("../AlphabetSelector", () => ({
  AlphabetSelector: () => <div data-testid="alphabet-selector" />,
}));

jest.mock("../AlphabeticList", () => ({
  AlphabeticList: () => <div data-testid="alphabetic-list" />,
}));

jest.mock("../SearchConnectionContent", () => ({
  SearchConnectionContent: () => (
    <div data-testid="search-connection-content" />
  ),
}));

const mockMappedConnections = [
  {
    key: "A",
    value: [
      { id: "1", label: "Alice", logo: "", status: "active", createdAtUTC: "" },
    ],
  },
  {
    key: "B",
    value: [
      { id: "2", label: "Bob", logo: "", status: "active", createdAtUTC: "" },
    ],
  },
];

describe("ConnectionsBody", () => {
  const defaultProps: ConnectionsBodyProps = {
    mappedConnections: mockMappedConnections as any,
    handleShowConnectionDetails: jest.fn(),
    search: "",
    setSearch: jest.fn(),
  };

  it("should render SearchConnectionContent when search has a value", () => {
    const { getByTestId } = render(
      <ConnectionsBody
        {...defaultProps}
        search="Alice"
      />
    );
    expect(getByTestId("search-connection-content")).toBeDefined();
  });
});
