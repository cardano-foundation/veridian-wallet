import "./BubbleCounter.scss";
import { BubbleCounterProps } from "./BubbleCounter.types";

const BubbleCounter = ({ counter }: BubbleCounterProps) => {
  if (counter === undefined || counter <= 0) {
    return null;
  }

  return (
    <span className="bubble-counter">{counter > 99 ? "99+" : counter}</span>
  );
};

export { BubbleCounter };
