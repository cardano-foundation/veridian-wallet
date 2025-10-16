import { PrivacyScreen } from "@capacitor-community/privacy-screen";
import { Capacitor } from "@capacitor/core";
import { useCallback } from "react";

const usePrivacyScreen = () => {
  const enablePrivacy = useCallback(async () => {
    return;
  }, []);

  const disablePrivacy = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    return PrivacyScreen.disable();
  }, []);

  return { enablePrivacy, disablePrivacy };
};

export { usePrivacyScreen };
