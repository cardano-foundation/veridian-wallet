import { useRef } from "react";
import { useScreenSize } from "../../../hooks";

const useCardOffsetTop = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const width = useScreenSize();

  // Calc distance from top of card to previous card
  const getCardOffsetTop = () => {
    if (!cardRef.current) return 0;

    const isGreatDevice = width >= 480;

    const marginTop = (cardRef.current.offsetWidth * 45) / 100;

    // card height - margin top (rem) (if screen size greater than 480px margin is 12rem, otherwise this value is 45% of card width)
    return cardRef.current.offsetHeight - (isGreatDevice ? 192 : marginTop);
  };

  return { cardRef, getCardOffsetTop };
};

export { useCardOffsetTop };
