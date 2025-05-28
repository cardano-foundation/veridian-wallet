import { useEffect, useState } from "react";
import { i18n } from "../../../i18n";
import "./MaxLoginAttemptAlert.scss";
import { MaxLoginAttemptAlertProps } from "./MaxLoginAttemptAlert.types";

const DURATION_STEP = 5000;

const MaxLoginAttemptAlert = ({ lockDuration }: MaxLoginAttemptAlertProps) => {
  const [remainLockTime, setRemainLockTime] = useState(lockDuration);

  useEffect(() => {
    setRemainLockTime(lockDuration);
  }, [lockDuration]);

  useEffect(() => {
    if (lockDuration <= DURATION_STEP) {
      return;
    }

    const timer = setInterval(() => {
      if (remainLockTime - DURATION_STEP > 0) {
        setRemainLockTime(() => remainLockTime - DURATION_STEP);
      }
    }, DURATION_STEP);

    return () => {
      clearInterval(timer);
    };
  }, [lockDuration, remainLockTime]);

  const durationText = (() => {
    const remainMinute = remainLockTime / 1000 / 60;

    let displayHours = Math.floor(remainMinute / 60);
    let displayMinutes = Math.ceil(remainMinute % 60);

    if (displayMinutes === 60) {
      ++displayHours;
      displayMinutes = 0;
    }

    let text = "";
    if (displayHours > 0) {
      text += i18n.t(
        displayHours > 1
          ? "lockpage.attemptalert.hours"
          : "lockpage.attemptalert.hour",
        {
          value: displayHours,
        }
      );
    }

    if (displayMinutes > 0) {
      text +=
        (text.length > 0 ? " " : "") +
        i18n.t(
          displayMinutes > 1
            ? "lockpage.attemptalert.minutes"
            : "lockpage.attemptalert.minute",
          {
            value: displayMinutes,
          }
        );
    }

    if (!text) {
      text = i18n.t("lockpage.attemptalert.minute", {
        value: 1,
      });
    }

    return text;
  })();

  return (
    <div
      data-testid="login-attempt-alert"
      className="login-attempt-alert"
    >
      <h2>{i18n.t("lockpage.attemptalert.title")}</h2>
      <p data-testid="alert-content">
        {i18n.t("lockpage.attemptalert.content", {
          time: durationText,
        })}
      </p>
    </div>
  );
};

export { MaxLoginAttemptAlert };
