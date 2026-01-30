import { useCallback, useState } from "react";
import { Agent } from "../../core/agent/agent";
import { useAppDispatch } from "../../store/hooks";
import { showError } from "../utils/error";
import { useOnlineStatusEffect } from "./useOnlineStatusEffect";

export const useGetOobi = (id?: string | number, displayName?: string) => {
  const [oobi, setOobi] = useState("");
  const dispatch = useAppDispatch();

  const fetchOobi = useCallback(async () => {
    try {
      if (!id) return;

      const oobiValue = await Agent.agent.connections.getOobi(`${id}`, {
        alias: displayName || "",
      });

      if (oobiValue) {
        setOobi(oobiValue);
      }
    } catch (e) {
      showError("Unable to fetch connection oobi", e, dispatch);
    }
  }, [id, displayName, dispatch]);

  useOnlineStatusEffect(fetchOobi);

  return oobi;
};
