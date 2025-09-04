import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { getCurrentProfile } from "../../store/reducers/profileCache";
import { useNotificationService } from "../../core/services/notificationService";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";
import { useBackgroundNotifications } from "./useBackgroundNotifications";
import { showError } from "../../ui/utils/error";

export const useNotificationManager = () => {
  const currentProfile = useAppSelector(getCurrentProfile);
  const dispatch = useAppDispatch();
  const notificationService = useNotificationService();
  const backgroundNotifications = useBackgroundNotifications();

  // Initialize notification permissions on mount
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        const granted = await notificationService.requestPermissions();
        if (granted) {
          showError("Notification permissions granted", null, dispatch);
        } else {
          showError("Notification permissions denied", null, dispatch);
        }
      } catch (error) {
        showError(
          "Failed to initialize notifications",
          error as Error,
          dispatch
        );
      }
    };

    initializePermissions();
  }, [notificationService, dispatch]);

  const showProfileNotification = (notification: KeriaNotification) => {
    // Only show notifications for the current profile
    if (
      currentProfile &&
      notification.receivingPre === currentProfile.identity.id
    ) {
      notificationService.showLocalNotification(notification);
    }
  };

  return {
    showProfileNotification,
    requestPermissions: () => notificationService.requestPermissions(),
    triggerBackgroundCheck: backgroundNotifications.triggerBackgroundCheck,
    getBackgroundStatus: backgroundNotifications.getStatus,
  };
};
