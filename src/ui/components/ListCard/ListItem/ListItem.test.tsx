import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { ListItem } from "./ListItem";
import { store } from "../../../../store";

describe("ListItem", () => {
  const mockOnClick = jest.fn();

  test("renders basic item with label and testId", () => {
    render(
      <ListItem
        label="Test Label"
        testId="test-item"
      />
    );

    expect(screen.getByTestId("test-item")).toBeInTheDocument();
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  test("renders with various props and styling", () => {
    const { container } = render(
      <ListItem
        label="Test Label"
        icon="test-icon"
        className="custom-class"
        note="Test Note"
        endSlotIcon="end-icon"
        testId="test-item"
      />
    );

    expect(screen.getByText("Test Note")).toBeInTheDocument();
    expect(screen.getByTestId("test-item")).toHaveClass(
      "list-item",
      "custom-class"
    );
    // Start icon should not be present by default
    expect(container.querySelector('[slot="start"]')).not.toBeInTheDocument();
    expect(container.querySelector('[slot="end"]')).toBeInTheDocument();
  });

  test("renders start icon when showStartIcon is true", () => {
    const { container } = render(
      <ListItem
        label="Test Label"
        icon="test-icon"
        showStartIcon={true}
        testId="test-item"
      />
    );

    expect(container.querySelector('[slot="start"]')).toBeInTheDocument();
  });

  test("handles interactions and navigation", () => {
    render(
      <ListItem
        label="Test Label"
        onClick={mockOnClick}
        href="https://example.com"
        testId="test-item"
      />
    );

    const itemElement = screen.getByTestId("test-item");
    fireEvent.click(itemElement);

    expect(mockOnClick).toHaveBeenCalledTimes(1);

    const linkElement = itemElement.closest("a");
    expect(linkElement).toHaveAttribute("href", "https://example.com");
  });

  test("renders with actionIcon component", () => {
    const actionIcon = <span data-testid="action-icon">Action</span>;

    render(
      <ListItem
        label="Test Label"
        actionIcon={actionIcon}
        testId="test-item"
      />
    );

    expect(screen.getByTestId("action-icon")).toBeInTheDocument();
  });

  test("renders in title mode with Redux context", () => {
    const { container } = render(
      <Provider store={store}>
        <ListItem
          title="Test Title"
          copyContent="Copy this content"
          flatBorder={0}
          testId="test-item"
        />
      </Provider>
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(container.querySelector(".card-block")).toHaveClass(
      "flat-border-top"
    );
  });

  test("handles index-based testId generation", () => {
    render(
      <ListItem
        label="Test Label"
        index={5}
      />
    );

    expect(screen.getByTestId("list-item-5")).toBeInTheDocument();
  });

  test("conditionally renders children based on mode", () => {
    const { rerender } = render(
      <ListItem testId="test-item">
        <div data-testid="child-content">Child Content</div>
      </ListItem>
    );

    expect(screen.queryByTestId("child-content")).not.toBeInTheDocument();

    rerender(
      <Provider store={store}>
        <ListItem
          title="Test Title"
          testId="test-item"
        >
          <div data-testid="child-content">Child Content</div>
        </ListItem>
      </Provider>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });
});
