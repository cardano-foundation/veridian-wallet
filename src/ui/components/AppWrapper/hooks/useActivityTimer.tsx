import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import { getPlatforms } from "@ionic/react";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import {
  getAuthentication,
  getIsShowSeedPhrase,
  logout,
} from "../../../../store/reducers/stateCache";

const BASE_TIMEOUT = process.env.NODE_ENV === "development" ? 3600000 : 60000; // 1h/1min

const getTimeout = (isShowRecoveryPhrase?: boolean) =>
  isShowRecoveryPhrase ? BASE_TIMEOUT * 3 : BASE_TIMEOUT;

const useActivityTimer = () => {
  const dispatch = useAppDispatch();
  const isShowRecoveryPhrase = useAppSelector(getIsShowSeedPhrase);
  const isLogin = useAppSelector(getAuthentication).loggedIn;
  const [pauseTimestamp, setPauseTimestamp] = useState(new Date().getTime());
  const timer = useRef<NodeJS.Timeout | null>(null);
  const timeout = getTimeout(isShowRecoveryPhrase);
  const pauseTimeout = timeout / 2;

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
  };

  const handleActivity = useCallback(() => {
    clearTimer();
    timer.current = setTimeout(() => {
      dispatch(logout());
    }, timeout);
  }, [dispatch, timeout]);

  useEffect(() => {
    const platforms = getPlatforms();
    if (!platforms.includes("mobileweb")) {
      const pauseListener = App.addListener("pause", () => {
        const now = new Date().getTime();
        setPauseTimestamp(now);
      });

      const resumeListener = App.addListener("resume", () => {
        const now = new Date().getTime();
        if (now - pauseTimestamp > pauseTimeout) {
          dispatch(logout());
        }
      });

      return () => {
        pauseListener.then((listener) => listener.remove());
        resumeListener.then((listener) => listener.remove());
        clearTimer();
      };
    }
  }, [dispatch, pauseTimeout, pauseTimestamp]);

  useEffect(() => {
    if (!isLogin) return;

    const events = [
      "load",
      "mousemove",
      "touchstart",
      "touchmove",
      "click",
      "focus",
      "keydown",
      "scroll",
    ];

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    handleActivity();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      clearTimer();
    };
  }, [handleActivity, isLogin, isShowRecoveryPhrase]);

  return {
    setPauseTimestamp,
  };
};

export { useActivityTimer };
