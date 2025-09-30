import { useEffect, useRef, useState } from "react";
import { CredentialService } from "../services";

interface PresentationVerificationResult {
  verified: boolean;
  credentialSAD?: any;
}

interface UsePresentationVerificationProps {
  ipexApplySaid?: string;
  discloserIdentifier?: string;
  enabled: boolean;
  onVerificationSuccess?: (result: PresentationVerificationResult) => void;
}

export const usePresentationVerification = ({
  ipexApplySaid,
  discloserIdentifier,
  enabled,
  onVerificationSuccess,
}: UsePresentationVerificationProps) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = () => {
    if (!ipexApplySaid || !discloserIdentifier || isVerified || isPolling) {
      return;
    }

    console.log("Starting polling for presentation verification");

    setIsPolling(true);

    const poll = async () => {
      try {
        console.log("Verifying presentation");
        console.log("Ipex apply said:", ipexApplySaid);
        console.log("Discloser identifier:", discloserIdentifier);
        const response = await CredentialService.verifyPresentation(
          ipexApplySaid,
          discloserIdentifier
        );

        console.log("Presentation verification response:", response);

        if (response.data.success && response.data.data.verified) {
          setIsVerified(true);
          setIsPolling(false);

          // Clear intervals
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          // Call success callback
          onVerificationSuccess?.(response.data.data);
        }
      } catch (error) {
        console.error("Error verifying presentation:", error);
      }
    };

    // Start polling every 500ms
    intervalRef.current = setInterval(poll, 500);

    // Stop polling after 5 minutes
    timeoutRef.current = setTimeout(
      () => {
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      },
      5 * 60 * 1000
    );

    // Initial poll
    poll();
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPolling(false);
  };

  useEffect(() => {
    if (enabled && !isVerified && !isPolling) {
      startPolling();
    } else if (!enabled) {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, isVerified, isPolling, ipexApplySaid, discloserIdentifier]);

  return {
    isVerified,
    isPolling,
    startPolling,
    stopPolling,
  };
};
