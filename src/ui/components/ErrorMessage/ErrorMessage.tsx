import { useEffect, useState } from "react";
import "./ErrorMessage.scss";
import { ErrorMessageProps } from "./ErrorMessage.types";

const MESSAGE_MILLISECONDS = 1500;

const ErrorMessage = ({ message, timeout, action }: ErrorMessageProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (timeout) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, MESSAGE_MILLISECONDS);

      return () => {
        clearTimeout(timer);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {message ? (
        <div
          data-testid="error-message"
          className={`error-message ${visible ? "visible" : ""}`}
        >
          <p
            className="text-fadein"
            data-testid="error-message-text"
          >
            {message} {action}
          </p>
        </div>
      ) : (
        <div className="error-message-placeholder" />
      )}
    </>
  );
};

export { MESSAGE_MILLISECONDS, ErrorMessage };
