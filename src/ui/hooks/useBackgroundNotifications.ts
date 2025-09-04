import { useEffect } from "react";
import { backgroundNotificationService } from "../../core/services/backgroundNotificationService";

export const useBackgroundNotifications = () => {
  useEffect(() => {
    // The background notification service initializes itself
    // and manages background tasks automatically based on app state
    return () => {
      // Cleanup is handled by the service itself
    };
  }, []);

  return {
    triggerBackgroundCheck: () =>
      backgroundNotificationService.triggerBackgroundCheck(),
    getStatus: () => backgroundNotificationService.getStatus(),
  };
};
