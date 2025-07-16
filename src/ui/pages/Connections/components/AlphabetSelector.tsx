import { IonButton } from "@ionic/react";
import { useCallback, useEffect, useRef } from "react";

const BUTTON_CLASS = "alphabet-button";
const ACTIVE_CLASS = "active";

const AlphabetSelector = () => {
  const alphabet = new Array(26)
    .fill(1)
    .map((_, i) => String.fromCharCode(65 + i))
    .concat("#");

  const handleClickScroll = (letter: string) => {
    const element = document.getElementById(letter);
    if (element) {
      setTimeout(() => {
        element.scrollIntoView?.({ behavior: "smooth" });
      }, 150);
    }
  };

  const lastItemRef = useRef<HTMLButtonElement | null>(null);

  const handleMove = useCallback((ev: TouchEvent) => {
    const touch = ev.touches[0];

    if (!touch) return;

    const elements =
      document.elementsFromPoint?.(touch.clientX, touch.clientY) || [];

    const button = elements.find((item) => {
      return (
        item.tagName === "ION-BUTTON" && item.classList.contains(BUTTON_CLASS)
      );
    });

    if (!button) return;

    lastItemRef.current?.classList.remove(ACTIVE_CLASS);
    button.classList.add(ACTIVE_CLASS);
    lastItemRef.current = button as HTMLButtonElement;
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastItemRef.current?.classList.remove(ACTIVE_CLASS);
    lastItemRef.current?.click();
    lastItemRef.current = null;
  }, []);

  const handleTouchCancel = useCallback(() => {
    lastItemRef.current = null;
  }, []);

  useEffect(() => {
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [handleMove, handleTouchEnd, handleTouchCancel]);

  return (
    <div
      data-testid="alphabet-selector"
      className="alphabet-selector"
    >
      {alphabet.map((letter, index) => {
        return (
          <IonButton
            slot="fixed"
            onClick={() => handleClickScroll(letter)}
            key={index}
            color="transparent"
            className={BUTTON_CLASS}
            onTouchStart={(e) => {
              (e.target as HTMLButtonElement).classList.add(ACTIVE_CLASS);
              lastItemRef.current = e.target as HTMLButtonElement;
            }}
            data-testid={`alphabet-selector-${letter}`}
          >
            {letter}
          </IonButton>
        );
      })}
    </div>
  );
};

export { AlphabetSelector };
