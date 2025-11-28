import { useEffect } from "react";
import { useAppSelector } from "../../store/hooks";
import { getIsOnline } from "../../store/reducers/stateCache";

const useOnlineStatusEffect = (callback: () => void | never) => {
  const isOnline = useAppSelector(getIsOnline);
  const isRunningInJest: boolean =
    typeof process !== "undefined" && process.env.JEST_WORKER_ID !== undefined;

  useEffect(() => {
    if (isOnline || isRunningInJest) {
      callback();
    } else {
      return;
    }
  }, [isOnline, callback, isRunningInJest]);
};

export { useOnlineStatusEffect };
