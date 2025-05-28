import { useCallback, useEffect, useState } from "react";
import { Agent } from "../../../../core/agent/agent";
import { LoginAttempts } from "../../../../core/agent/services/auth.types";
import { i18n } from "../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import {
  getLoginAttempt,
  setLoginAttempt as setStoreLoginAttempt,
} from "../../../../store/reducers/stateCache";
import { showError } from "../../../utils/error";

const MAX_LOGIN_ATTEMPT = 5;

const useLoginAttempt = () => {
  const dispatch = useAppDispatch();
  const loginAttempt = useAppSelector(getLoginAttempt);

  const remainAttempt = MAX_LOGIN_ATTEMPT - loginAttempt.attempts;

  const errorMessage = (() => {
    switch (remainAttempt) {
      case 5:
      case 4:
        return undefined;
      case 3:
      case 2:
        return i18n.t("lockpage.attempterror", {
          attempt: remainAttempt,
        });
      case 1:
        return i18n.t("lockpage.attempterror", {
          attempt: 1,
        });
      default:
        return undefined;
    }
  })();

  const setLoginAttempt = useCallback(
    (value: LoginAttempts) => {
      dispatch(setStoreLoginAttempt(value));
    },
    [dispatch]
  );

  const lockDuration = (() => {
    if (remainAttempt > 0) return 0;

    return loginAttempt.lockedUntil - Date.now();
  })();

  const [isLock, setIsLock] = useState(lockDuration > 0);

  const incrementLoginAttempt = useCallback(async () => {
    try {
      const loginAttempt = await Agent.agent.auth.incrementLoginAttempts();
      setLoginAttempt(loginAttempt);
    } catch (e) {
      showError("Unable to increment login attemp", e, dispatch);
    }
  }, [setLoginAttempt, dispatch]);

  const resetLoginAttempt = useCallback(async () => {
    try {
      await Agent.agent.auth.resetLoginAttempts();
      setLoginAttempt({
        lockedUntil: Date.now(),
        attempts: 0,
      });
    } catch (e) {
      showError("Unable to reset login attemp", e, dispatch);
    }
  }, [setLoginAttempt, dispatch]);

  useEffect(() => {
    if (lockDuration <= 0) {
      setIsLock(false);
      return;
    }

    setIsLock(true);
    const timerId = setTimeout(() => {
      setIsLock(false);
    }, lockDuration);

    return () => {
      clearTimeout(timerId);
    };
  }, [lockDuration]);

  return {
    isLock,
    errorMessage,
    lockDuration,
    resetLoginAttempt,
    incrementLoginAttempt,
  };
};

export { useLoginAttempt };
