import { useEffect, useRef, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { updatePresentationStatus } from "../store/reducers/connectionsSlice";
import { PresentationRequestStatus } from "../store/reducers/connectionsSlice.types";
import { CredentialService } from "../services";

export const usePresentationPolling = () => {
  const dispatch = useAppDispatch();
  const presentationRequests = useAppSelector(
    (state) => state.connections.presentationRequests
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const errorCountRef = useRef(0);
  const maxErrors = 5;

  const requestedPresentations = presentationRequests.filter(
    (request) => request.status === PresentationRequestStatus.Requested
  );

  const pollAllRequested = useCallback(async () => {
    if (requestedPresentations.length === 0) {
      return;
    }

    for (const request of requestedPresentations) {
      try {
        const response = await CredentialService.verifyPresentation(
          request.ipexApplySaid,
          request.discloserIdentifier
        );

        if (response.data.success && response.data.data.verified) {
          dispatch(
            updatePresentationStatus({
              id: request.id,
              status: PresentationRequestStatus.Presented,
            })
          );
        }
      } catch (error) {
        errorCountRef.current += 1;

        if (errorCountRef.current >= maxErrors) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }
      }
    }

    if (requestedPresentations.length > 0) {
      errorCountRef.current = 0;
    }
  }, [requestedPresentations, dispatch]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(pollAllRequested, 750);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pollAllRequested]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
};
