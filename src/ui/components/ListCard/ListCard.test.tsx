import { render, screen } from "@testing-library/react";
import { ListCard } from "./ListCard";

interface TestItem {
  id: string;
  label: string;
}

describe("ListCard", () => {
  const mockItems: TestItem[] = [
    { id: "item1", label: "Item 1" },
    { id: "item2", label: "Item 2" },
  ];

  const mockRenderItem = (item: TestItem, index: number) => (
    <div
      key={item.id}
      data-testid={`test-item-${index}`}
    >
      {item.label}
    </div>
  );

  test("renders items with custom props", () => {
    const { container } = render(
      <ListCard
        items={mockItems}
        renderItem={mockRenderItem}
        testId="custom-card"
        className="custom-class"
      />
    );

    expect(screen.getByTestId("custom-card")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(container.querySelector(".list-card")).toHaveClass(
      "list-card",
      "custom-class"
    );
  });

  test("handles empty items array", () => {
    const { container } = render(
      <ListCard
        items={[]}
        renderItem={mockRenderItem}
      />
    );

    const listElement = container.querySelector(".list-card");
    expect(listElement).toBeInTheDocument();
  });

  test("passes correct props to renderItem function", () => {
    const mockRenderItemWithIndex = jest.fn((item: TestItem, index: number) => (
      <div key={item.id}>
        {item.label} - {index}
      </div>
    ));

    render(
      <ListCard
        items={mockItems}
        renderItem={mockRenderItemWithIndex}
      />
    );

    expect(mockRenderItemWithIndex).toHaveBeenCalledWith(mockItems[0], 0);
    expect(mockRenderItemWithIndex).toHaveBeenCalledWith(mockItems[1], 1);
    expect(screen.getByText("Item 1 - 0")).toBeInTheDocument();
  });
});
