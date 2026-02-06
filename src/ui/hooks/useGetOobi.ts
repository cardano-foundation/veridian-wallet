import { useCallback, useRef, useState } from "react";
import { Agent } from "../../core/agent/agent";
import { CreationStatus } from "../../core/agent/agent.types";
import { IdentifierShortDetails } from "../../core/agent/services/identifier.types";
import { useAppDispatch } from "../../store/hooks";
import { showError } from "../utils/error";
import { useOnlineStatusEffect } from "./useOnlineStatusEffect";

export const useGetOobi = (profile?: IdentifierShortDetails) => {
  const [oobi, setOobi] = useState("");
  const dispatch = useAppDispatch();
  const retry = useRef(0);

  const fetchOobi = useCallback(async () => {
    try {
      if (!profile || profile.creationStatus != CreationStatus.COMPLETE) return;

      const oobiValue = await Agent.agent.connections.getOobi(`${profile.id}`, {
        alias: profile.displayName || "",
      });

      if (oobiValue) {
        setOobi(oobiValue);
      }
    } catch (e) {
      if (retry.current < 3) {
        await fetchOobi();
        return;
      }

      showError("Unable to fetch connection oobi", e, dispatch);
    }
  }, [profile, dispatch]);

  useOnlineStatusEffect(fetchOobi);

  return oobi;
};
