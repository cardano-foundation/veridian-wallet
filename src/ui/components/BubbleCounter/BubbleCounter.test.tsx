import { render } from "@testing-library/react";
import { BubbleCounter } from "./BubbleCounter";

describe("BubbleCounter", () => {
  it("renders nothing when no counter", () => {
    const { container } = render(<BubbleCounter />);

    const counter = container.querySelector(".bubble-counter");
    expect(counter).not.toBeInTheDocument();
  });

  it("renders nothing when counter is 0", () => {
    const { container } = render(<BubbleCounter counter={0} />);

    const counter = container.querySelector(".bubble-counter");
    expect(counter).not.toBeInTheDocument();
  });

  it("renders counter when counter > 0", () => {
    const { container, getByText } = render(<BubbleCounter counter={5} />);

    const counter = container.querySelector(".bubble-counter");
    expect(counter).toBeInTheDocument();
    expect(getByText("5")).toBeInTheDocument();
  });

  it("renders 99+ when counter > 99", () => {
    const { getByText } = render(<BubbleCounter counter={150} />);

    expect(getByText("99+")).toBeInTheDocument();
  });
});
