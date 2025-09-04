import { useEffect } from "react";
import { useAppSelector } from "../../store/hooks";
import { getNotificationsCache } from "../../store/reducers/profileCache";
import { useNotificationService } from "../../core/services/notificationService";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";

export const useLocalNotifications = () => {
  const notifications = useAppSelector(getNotificationsCache);
  const notificationService = useNotificationService();

  useEffect(() => {
    // Show local notifications for unread notifications when app is active
    const unreadNotifications = notifications.filter(
      (notification) => !notification.read
    );

    unreadNotifications.forEach((notification) => {
      notificationService.showLocalNotification(notification);
    });
  }, [notifications, notificationService]);

  return {
    showNotification: (notification: KeriaNotification) =>
      notificationService.showLocalNotification(notification),
    requestPermissions: () => notificationService.requestPermissions(),
  };
};
