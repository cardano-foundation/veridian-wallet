import { render } from "@testing-library/react";
import { ConnectionsBody } from "./ConnectionsBody";
import { ConnectionsBodyProps } from "./ConnectionsBody.types";

jest.mock("@ionic/react", () => ({
  IonContent: ({ children, scrollY }: any) => (
    <div
      data-testid="ion-content"
      data-scrolly={scrollY.toString()}
    >
      {children}
    </div>
  ),
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

  it("should have scrollY={true} when search is empty string", () => {
    const { getByTestId } = render(<ConnectionsBody {...defaultProps} />);
    const content = getByTestId("ion-content");
    expect(content.getAttribute("data-scrolly")).toBe("true");
  });

  it("should have scrollY={true} when search has results", () => {
    const { getByTestId } = render(
      <ConnectionsBody
        {...defaultProps}
        search="Alice"
      />
    );
    const content = getByTestId("ion-content");
    expect(content.getAttribute("data-scrolly")).toBe("true");
  });

  it("should have scrollY={false} when search has no results", () => {
    const { getByTestId } = render(
      <ConnectionsBody
        {...defaultProps}
        search="Zyx"
      />
    );
    const content = getByTestId("ion-content");
    expect(content.getAttribute("data-scrolly")).toBe("false");
  });
});
