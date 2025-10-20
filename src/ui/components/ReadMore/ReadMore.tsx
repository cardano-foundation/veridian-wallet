import { IonButton } from "@ionic/react";
import { useEffect, useRef, useState } from "react";
import { i18n } from "../../../i18n";
import "./ReadMore.scss";

const ReadMore = ({ content }: { content: string }) => {
  const [isReadMore, setIsReadMore] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const checkedRef = useRef(false);

  const toggleReadMore = () => {
    setIsReadMore(!isReadMore);
  };

  useEffect(() => {
    // Reset check flag when content changes
    checkedRef.current = false;
    setIsOverflowing(false);

    const checkOverflow = () => {
      const el = textRef.current;
      if (!el || checkedRef.current) return;

      // Force reflow to ensure layout is complete
      void el.offsetHeight;

      const styles = getComputedStyle(el);
      const lineHeight = parseFloat(styles.lineHeight);

      // If line-height is "normal" or NaN, calculate it from font-size
      const actualLineHeight = isNaN(lineHeight)
        ? parseFloat(styles.fontSize) * 1.2
        : lineHeight;

      const maxHeight = actualLineHeight * 2;

      // For -webkit-line-clamp, compare scrollHeight with actual rendered height
      // Add small tolerance for sub-pixel rendering differences
      const tolerance = 2;
      const hasOverflow = el.scrollHeight > maxHeight + tolerance;

      if (hasOverflow) {
        setIsOverflowing(true);
        checkedRef.current = true;
      }
    };

    let timeoutId: NodeJS.Timeout;
    let resizeObserver: ResizeObserver | null = null;

    // Use ResizeObserver as the primary detection method
    if (textRef.current && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        // Only check after the element has settled (not during initial rapid changes)
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          checkOverflow();
        }, 50);
      });

      resizeObserver.observe(textRef.current);
    }

    // Fallback checks for browsers without ResizeObserver or slow font loading
    const timer1 = setTimeout(checkOverflow, 100);
    const timer2 = setTimeout(checkOverflow, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (timeoutId) clearTimeout(timeoutId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [content]);

  return (
    <div
      data-testid="read-more"
      className="read-more"
    >
      <span
        data-testid="read-more-text"
        className={isReadMore ? "" : "clamp"}
        ref={textRef}
      >
        {content}
      </span>
      {isOverflowing && (
        <IonButton
          onClick={toggleReadMore}
          data-testid="read-more-button"
        >
          {isReadMore ? i18n.t("readmore.less") : i18n.t("readmore.more")}
        </IonButton>
      )}
    </div>
  );
};

export { ReadMore };
