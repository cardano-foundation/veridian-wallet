import { IonButton } from "@ionic/react";
import React, { useEffect, useRef, useState } from "react";
import { i18n } from "../../../i18n";
import "./ReadMore.scss";

const ReadMore = ({
  content,
  children,
}: {
  content: string;
  children?: React.ReactNode;
}) => {
  const [isReadMore, setIsReadMore] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLSpanElement | null>(null);

  const toggleReadMore = () => {
    setIsReadMore(!isReadMore);
  };

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      const maxHeight = lineHeight * 2;

      if (el.scrollHeight > maxHeight + 1) {
        setIsOverflowing(true);
      }
    }
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
      {children}
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
